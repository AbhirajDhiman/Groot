const fs = require("fs").promises;
const path = require("path");
const { s3, S3_BUCKET } = require("../config/aws-config");

const repoBase = path.resolve(__dirname, '..');

async function pullRepo() {
  const repoPath = path.join(repoBase, ".Groot");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const response = await s3
      .listObjectsV2({
        Bucket: S3_BUCKET,
        Prefix: "commits/",
      })
      .promise();

    const objects = response.Contents || [];
    if (objects.length === 0) {
      console.log("No remote commit objects found in S3.");
      return;
    }

    for (const object of objects) {
      if (!object.Key || object.Key.endsWith("/")) {
        continue;
      }

      const key = object.Key;
      const localFilePath = path.join(repoPath, key);
      await fs.mkdir(path.dirname(localFilePath), { recursive: true });

      const params = {
        Bucket: S3_BUCKET,
        Key: key,
      };

      const fileObject = await s3.getObject(params).promise();
      await fs.writeFile(localFilePath, fileObject.Body);
      console.log(`Pulled ${key} from S3 to ${localFilePath}`);
    }

    console.log("All commits pulled from S3.");
  } catch (err) {
    if (err.code === 'NoSuchBucket') {
      console.error(`Unable to pull: S3 bucket '${S3_BUCKET}' does not exist.`);
    } else if (err.code === 'AccessDenied') {
      console.error("Unable to pull: access denied to S3 bucket. Check AWS credentials and permissions.");
    } else {
      console.error("Unable to pull:", err);
    }
  }
}

module.exports = { pullRepo };