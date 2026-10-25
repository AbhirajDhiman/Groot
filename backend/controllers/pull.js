const fs = require('fs').promises;
const path = require('path');
const { S3_BUCKET, s3 } = require('../config/aws-config');
const {
  ensureRepoRoot,
  readJson,
} = require('../utils/repoUtils');

/**
 * Pulls remote commits and metadata from AWS S3 to the local Groot repository.
 */
async function pullRepo() {
  try {
    const { grootDir } = await ensureRepoRoot();
    const configPath = path.join(grootDir, 'config.json');

    const repoConfig = (await readJson(configPath)) || {};
    const targetBucket = repoConfig.bucket || S3_BUCKET;

    if (!targetBucket) {
      console.error('Error: No S3 bucket configured. Specify S3_BUCKET in .env or .groot/config.json');
      return { success: false, error: 'No S3 bucket configured' };
    }

    console.log(`Pulling commits from remote bucket: ${targetBucket}...`);

    const response = await s3
      .listObjectsV2({
        Bucket: targetBucket,
        Prefix: 'commits/',
      })
      .promise();

    const objects = response.Contents || [];
    if (objects.length === 0) {
      console.log('No remote commit objects found in S3.');
      return { success: true, pulledCount: 0 };
    }

    let pulledCount = 0;
    for (const object of objects) {
      if (!object.Key || object.Key.endsWith('/')) {
        continue;
      }

      const key = object.Key;
      const localFilePath = path.join(grootDir, key);
      await fs.mkdir(path.dirname(localFilePath), { recursive: true });

      const fileObject = await s3
        .getObject({
          Bucket: targetBucket,
          Key: key,
        })
        .promise();

      await fs.writeFile(localFilePath, fileObject.Body);
      pulledCount++;
    }

    // Attempt to pull updated metadata (HEAD, log.json)
    try {
      const metaResponse = await s3
        .listObjectsV2({
          Bucket: targetBucket,
          Prefix: 'metadata/',
        })
        .promise();

      const metaObjects = metaResponse.Contents || [];
      for (const meta of metaObjects) {
        if (!meta.Key || meta.Key.endsWith('/')) continue;
        const fileName = path.basename(meta.Key);
        const fileObject = await s3
          .getObject({
            Bucket: targetBucket,
            Key: meta.Key,
          })
          .promise();
        await fs.writeFile(path.join(grootDir, fileName), fileObject.Body);
      }
    } catch {
      // Metadata pull optional
    }

    console.log(`Successfully pulled ${pulledCount} object(s) from S3.`);
    return { success: true, pulledCount };
  } catch (err) {
    if (err.code === 'NoSuchBucket') {
      console.error(`Pull failed: S3 bucket does not exist.`);
    } else if (err.code === 'AccessDenied' || err.code === 'CredentialsError') {
      console.error(`Pull failed: AWS authentication failed. Check your AWS credentials in .env.`);
    } else {
      console.error('Error pulling changes from remote repository:', err.message);
    }
    return { success: false, error: err.message };
  }
}

module.exports = { pullRepo };