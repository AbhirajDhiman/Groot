const fs = require('fs').promises;
const path = require('path');
const { S3_BUCKET, s3 } = require('../config/aws-config');

const repoBase = path.resolve(__dirname, '..');

const pushChanges = async () => {
  const repoPath = path.join(repoBase, '.Groot');
  const commitsPath = path.join(repoPath, 'commits');

  try {
    const entries = await fs.readdir(commitsPath, { withFileTypes: true });
    const commitDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    if (commitDirs.length === 0) {
      console.log('No commits found to push. Make sure you have committed changes before pushing.');
      return;
    }

    for (const commitDir of commitDirs) {
      const commitDirPath = path.join(commitsPath, commitDir);
      const files = await fs.readdir(commitDirPath);

      for (const fileName of files) {
        const filePath = path.join(commitDirPath, fileName);
        const fileData = await fs.readFile(filePath);
        const params = {
          Bucket: S3_BUCKET,
          Key: `commits/${commitDir}/${fileName}`,
          Body: fileData,
        };

        await s3.upload(params).promise();
        console.log(`Pushed ${fileName} from commit ${commitDir} to remote repository.`);
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('Push failed: repository or commits directory not found. Run init and create at least one commit.');
    } else {
      console.error('Error pushing changes to remote repository:', err);
    }
  }
};

module.exports = { pushChanges };