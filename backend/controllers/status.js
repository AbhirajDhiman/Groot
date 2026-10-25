const fs = require('fs').promises;
const path = require('path');
const {
  ensureRepoRoot,
  getRelativeFiles,
  readJson,
} = require('../utils/repoUtils');

/**
 * Checks the status of the repository: staged files, modified unstaged files, and untracked files.
 */
async function repoStatus() {
  try {
    const { rootDir, grootDir } = await ensureRepoRoot();
    const stagingPath = path.join(grootDir, 'staging');
    const headFile = path.join(grootDir, 'HEAD');
    const commitsPath = path.join(grootDir, 'commits');

    // 1. Files in staging
    const stagedFiles = await getRelativeFiles(stagingPath, stagingPath);

    // 2. Files in current working directory
    const workingFiles = await getRelativeFiles(rootDir, rootDir);

    // 3. Files in latest commit (HEAD)
    let headFiles = [];
    let headCommitId = null;
    try {
      headCommitId = (await fs.readFile(headFile, 'utf8')).trim();
      if (headCommitId) {
        const headCommitDir = path.join(commitsPath, headCommitId);
        headFiles = await getRelativeFiles(headCommitDir, headCommitDir, [
          'commit.json',
          '.DS_Store',
        ]);
      }
    } catch {
      // No HEAD commit yet
    }

    const stagedSet = new Set(stagedFiles);
    const headSet = new Set(headFiles);

    const changesToBeCommitted = [];
    for (const file of stagedFiles) {
      if (headSet.has(file)) {
        changesToBeCommitted.push({ file, type: 'modified' });
      } else {
        changesToBeCommitted.push({ file, type: 'new file' });
      }
    }

    const unstagedChanges = [];
    const untrackedFiles = [];

    for (const file of workingFiles) {
      const workingPath = path.join(rootDir, file);

      if (stagedSet.has(file)) {
        // Compare working file with staged file content
        try {
          const stagedPath = path.join(stagingPath, file);
          const [workContent, stageContent] = await Promise.all([
            fs.readFile(workingPath),
            fs.readFile(stagedPath),
          ]);
          if (!workContent.equals(stageContent)) {
            unstagedChanges.push({ file, type: 'modified' });
          }
        } catch {
          // Ignore read error
        }
      } else if (headSet.has(file)) {
        // Compare working file with HEAD file content
        try {
          const headFilePath = path.join(commitsPath, headCommitId, file);
          const [workContent, headContent] = await Promise.all([
            fs.readFile(workingPath),
            fs.readFile(headFilePath),
          ]);
          if (!workContent.equals(headContent)) {
            unstagedChanges.push({ file, type: 'modified' });
          }
        } catch {
          // Ignore read error
        }
      } else {
        untrackedFiles.push(file);
      }
    }

    // Display status
    console.log(`\n=== Groot Repository Status ===`);
    if (headCommitId) {
      console.log(`On commit: ${headCommitId.slice(0, 8)}`);
    } else {
      console.log(`No commits yet`);
    }

    if (changesToBeCommitted.length > 0) {
      console.log(`\nChanges to be committed:`);
      console.log(`  (use "groot commit <message>" to record changes)`);
      for (const item of changesToBeCommitted) {
        console.log(`\t\x1b[32m${item.type}:   ${item.file}\x1b[0m`);
      }
    }

    if (unstagedChanges.length > 0) {
      console.log(`\nChanges not staged for commit:`);
      console.log(`  (use "groot add <file>..." to update what will be committed)`);
      for (const item of unstagedChanges) {
        console.log(`\t\x1b[31m${item.type}:   ${item.file}\x1b[0m`);
      }
    }

    if (untrackedFiles.length > 0) {
      console.log(`\nUntracked files:`);
      console.log(`  (use "groot add <file>..." to include in what will be committed)`);
      for (const file of untrackedFiles) {
        console.log(`\t\x1b[31m${file}\x1b[0m`);
      }
    }

    if (
      changesToBeCommitted.length === 0 &&
      unstagedChanges.length === 0 &&
      untrackedFiles.length === 0
    ) {
      console.log(`\nWorking tree clean. Nothing to commit.`);
    }
    console.log('');

    return {
      success: true,
      headCommitId,
      staged: changesToBeCommitted,
      unstaged: unstagedChanges,
      untracked: untrackedFiles,
    };
  } catch (err) {
    console.error('Error getting repository status:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { repoStatus };
