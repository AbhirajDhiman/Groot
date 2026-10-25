const fs = require('fs').promises;
const path = require('path');
const {
  ensureRepoRoot,
  getRelativeFiles,
} = require('../utils/repoUtils');

/**
 * Reverts the working directory to the exact snapshot of a specified commit ID.
 * Supports full commit UUID or unique commit prefix.
 */
async function revertCommit(commitIdentifier) {
  if (!commitIdentifier || typeof commitIdentifier !== 'string') {
    console.error('Error: Commit ID or prefix is required. Usage: groot revert <commitID>');
    return { success: false, error: 'Commit ID is required' };
  }

  try {
    const { rootDir, grootDir } = await ensureRepoRoot();
    const commitsPath = path.join(grootDir, 'commits');

    const entries = await fs.readdir(commitsPath, { withFileTypes: true });
    const commitDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);

    // Match exact or prefix
    const matched = commitDirs.filter(
      (dir) => dir.toLowerCase() === commitIdentifier.toLowerCase() ||
               dir.toLowerCase().startsWith(commitIdentifier.toLowerCase())
    );

    if (matched.length === 0) {
      console.error(`Error: Commit "${commitIdentifier}" not found in .groot/commits.`);
      return { success: false, error: 'Commit not found' };
    }

    if (matched.length > 1) {
      console.error(
        `Error: Short commit ID "${commitIdentifier}" is ambiguous. Matches: ${matched.join(', ')}`
      );
      return { success: false, error: 'Ambiguous commit ID' };
    }

    const resolvedCommitId = matched[0];
    const commitDir = path.join(commitsPath, resolvedCommitId);

    // Get all files in commit snapshot except commit.json
    const filesToRestore = await getRelativeFiles(commitDir, commitDir, [
      'commit.json',
      '.DS_Store',
    ]);

    if (filesToRestore.length === 0) {
      console.log(`Commit ${resolvedCommitId.slice(0, 8)} contains no tracked files.`);
      return { success: true, restoredFiles: [] };
    }

    const restored = [];
    for (const relFile of filesToRestore) {
      const src = path.join(commitDir, relFile);
      const dest = path.join(rootDir, relFile);

      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      restored.push(relFile);
    }

    console.log(`\nSuccessfully reverted workspace to commit ${resolvedCommitId.slice(0, 8)}:`);
    for (const file of restored) {
      console.log(`  Restored: ${file}`);
    }
    console.log(`\nTotal: ${restored.length} file(s) restored.\n`);

    return {
      success: true,
      commitID: resolvedCommitId,
      restoredFiles: restored,
    };
  } catch (err) {
    console.error('Error reverting commit:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { revertCommit };