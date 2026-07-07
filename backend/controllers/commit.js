const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const repoBase = path.resolve(__dirname, '..');

const commitChanges = async (message) => {
  if (!message) {
    console.log("Commit message is required.");
    return;
  }

  const repoPath = path.join(repoBase, '.Groot');
  const stagePath = path.join(repoPath, 'staging');
  const commitsPath = path.join(repoPath, 'commits');

  try {
    const files = await fs.readdir(stagePath);
    if (files.length === 0) {
      console.log('No files staged. Use add before commit.');
      return;
    }

    const commitID = uuidv4();
    const commitDirectory = path.join(commitsPath, commitID);
    await fs.mkdir(commitDirectory, { recursive: true });

    for (const file of files) {
      await fs.copyFile(
        path.join(stagePath, file),
        path.join(commitDirectory, file)
      );
    }

    await fs.writeFile(
      path.join(commitDirectory, 'commit.json'),
      JSON.stringify({ message, date: new Date().toISOString(), commitID })
    );

    await fs.rm(stagePath, { recursive: true, force: true });
    await fs.mkdir(stagePath, { recursive: true });

    console.log(`Commit ${commitID} created successfully with message: "${message}"`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('No staged files found. Run add before commit.');
    } else {
      console.error("Error occurred while committing changes:", err);
    }
  }
};

module.exports = { commitChanges };