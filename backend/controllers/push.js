const fs = require('fs').promises;
const path = require('path');
const { S3_BUCKET, s3 } = require('../config/aws-config');
const {
  ensureRepoRoot,
  getRelativeFiles,
  readJson,
} = require('../utils/repoUtils');

/**
 * Pushes local commit snapshots and metadata to remote AWS S3 storage.
 */
async function pushChanges() {
  try {
    const { grootDir } = await ensureRepoRoot();
    const commitsPath = path.join(grootDir, 'commits');
    const configPath = path.join(grootDir, 'config.json');

    const repoConfig = (await readJson(configPath)) || {};
    const targetBucket = repoConfig.bucket || S3_BUCKET;

    if (!targetBucket) {
      console.error('Error: No S3 bucket configured. Specify S3_BUCKET in .env or .groot/config.json');
      return { success: false, error: 'No S3 bucket configured' };
    }

    const entries = await fs.readdir(commitsPath, { withFileTypes: true });
    const commitDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    if (commitDirs.length === 0) {
      console.log('No commits found to push. Create a commit first using "groot commit <message>".');
      return { success: false, error: 'No commits to push' };
    }

    console.log(`Pushing ${commitDirs.length} commit(s) to remote bucket: ${targetBucket}...`);

    let uploadedCount = 0;
    for (const commitId of commitDirs) {
      const commitDirPath = path.join(commitsPath, commitId);
      const commitFiles = await getRelativeFiles(commitDirPath, commitDirPath);

      for (const relFile of commitFiles) {
        const localPath = path.join(commitDirPath, relFile);
        const data = await fs.readFile(localPath);
        const remoteKey = `commits/${commitId}/${relFile}`;

        await s3
          .upload({
            Bucket: targetBucket,
            Key: remoteKey,
            Body: data,
          })
          .promise();

        uploadedCount++;
      }
    }

    // Push log.json and HEAD if present
    const syncFiles = ['log.json', 'HEAD'];
    for (const file of syncFiles) {
      const filePath = path.join(grootDir, file);
      try {
        const content = await fs.readFile(filePath);
        await s3
          .upload({
            Bucket: targetBucket,
            Key: `metadata/${file}`,
            Body: content,
          })
          .promise();
      } catch {
        // Optional file
      }
    }

    console.log(`Successfully pushed ${uploadedCount} object(s) across ${commitDirs.length} commit(s) to S3.`);
    return { success: true, uploadedCount, commitCount: commitDirs.length };
  } catch (err) {
    if (err.code === 'NoSuchBucket') {
      console.error(`Push failed: S3 bucket does not exist.`);
    } else if (err.code === 'AccessDenied' || err.code === 'CredentialsError') {
      console.error(`Push failed: AWS authentication failed. Check your AWS credentials in .env.`);
    } else {
      console.error('Error pushing changes to remote repository:', err.message);
    }
    return { success: false, error: err.message };
  }
}

module.exports = { pushChanges };