const fs = require("fs").promises;
const path = require("path");

const repoBase = path.resolve(__dirname, '..');

async function revertCommit(commitHash) {
  if (!commitHash) {
    console.log("No commit hash specified to revert.");
    return;
  }

  const repoPath = path.join(repoBase, ".Groot");
  const commitDir = path.join(repoPath, "commits", commitHash);
  const workspaceRoot = repoBase;

  try {
    const entries = await fs.readdir(commitDir, { withFileTypes: true });
    if (entries.length === 0) {
      console.log(`Commit ${commitHash} contains no files to restore.`);
      return;
    }

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      if (entry.name === "commit.json") {
        continue;
      }

      const sourcePath = path.join(commitDir, entry.name);
      const destinationPath = path.join(workspaceRoot, entry.name);
      await fs.copyFile(sourcePath, destinationPath);
      console.log(`Restored ${entry.name} from commit ${commitHash}.`);
    }

    console.log(`Commit ${commitHash} reverted successfully.`);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`Unable to revert: commit ${commitHash} not found in .Groot/commits.`);
    } else {
      console.error("Unable to revert:", err);
    }
  }
}

module.exports = { revertCommit };