const fs = require('fs').promises;
const path = require('path');
const {
  ensureRepoRoot,
  getRelativeFiles,
} = require('../utils/repoUtils');

/**
 * Computes a line-by-line difference between two text strings.
 */
function computeDiff(oldText, newText, filename) {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  const diffLines = [];
  diffLines.push(`--- a/${filename}`);
  diffLines.push(`+++ b/${filename}`);

  let i = 0;
  let j = 0;

  // Simple line comparison
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diffLines.push(`  ${oldLines[i]}`);
      i++;
      j++;
    } else if (i < oldLines.length && (j >= newLines.length || !newLines.includes(oldLines[i]))) {
      diffLines.push(`\x1b[31m- ${oldLines[i]}\x1b[0m`);
      i++;
    } else if (j < newLines.length) {
      diffLines.push(`\x1b[32m+ ${newLines[j]}\x1b[0m`);
      j++;
    }
  }

  return diffLines;
}

/**
 * Compares files in the repository.
 * Can compare working tree with staging/HEAD, or compare two specific commits.
 */
async function diffRepo(targetFile = null, commitA = null, commitB = null) {
  try {
    const { rootDir, grootDir } = await ensureRepoRoot();
    const commitsPath = path.join(grootDir, 'commits');
    const stagingPath = path.join(grootDir, 'staging');
    const headFile = path.join(grootDir, 'HEAD');

    // Case 1: Compare two commits
    if (commitA && commitB) {
      const dirA = path.join(commitsPath, commitA);
      const dirB = path.join(commitsPath, commitB);

      const filesA = await getRelativeFiles(dirA, dirA, ['commit.json']);
      const filesB = await getRelativeFiles(dirB, dirB, ['commit.json']);
      const allFiles = [...new Set([...filesA, ...filesB])];

      const targets = targetFile ? [targetFile] : allFiles;
      let hasChanges = false;

      for (const file of targets) {
        let contentA = '';
        let contentB = '';
        try {
          contentA = await fs.readFile(path.join(dirA, file), 'utf8');
        } catch {}
        try {
          contentB = await fs.readFile(path.join(dirB, file), 'utf8');
        } catch {}

        if (contentA !== contentB) {
          hasChanges = true;
          const lines = computeDiff(contentA, contentB, file);
          console.log(lines.join('\n'));
        }
      }

      if (!hasChanges) {
        console.log(`No differences between commit ${commitA.slice(0, 8)} and ${commitB.slice(0, 8)}.`);
      }
      return { success: true };
    }

    // Case 2: Compare working directory with staging or HEAD
    let compareDir = stagingPath;
    const stagedFiles = await getRelativeFiles(stagingPath, stagingPath);

    if (stagedFiles.length === 0) {
      // If nothing staged, compare working tree with HEAD
      try {
        const headCommit = (await fs.readFile(headFile, 'utf8')).trim();
        if (headCommit) {
          compareDir = path.join(commitsPath, headCommit);
        }
      } catch {}
    }

    const workingFiles = await getRelativeFiles(rootDir, rootDir);
    const targets = targetFile ? [targetFile] : workingFiles;
    let changesFound = false;

    for (const file of targets) {
      const workingFilePath = path.join(rootDir, file);
      const compareFilePath = path.join(compareDir, file);

      let workContent = '';
      let compareContent = '';

      try {
        workContent = await fs.readFile(workingFilePath, 'utf8');
      } catch {
        continue;
      }

      try {
        compareContent = await fs.readFile(compareFilePath, 'utf8');
      } catch {
        // File doesn't exist in compare target (e.g. new untracked file)
        continue;
      }

      if (workContent !== compareContent) {
        changesFound = true;
        const lines = computeDiff(compareContent, workContent, file);
        console.log(lines.join('\n'));
        console.log('');
      }
    }

    if (!changesFound) {
      console.log('No differences detected.');
    }

    return { success: true };
  } catch (err) {
    console.error('Error generating diff:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { diffRepo };
