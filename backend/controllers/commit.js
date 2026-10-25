const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  ensureRepoRoot,
  getRelativeFiles,
  copyDirectoryRecursive,
  readJson,
  writeJson,
} = require('../utils/repoUtils');

/**
 * Creates a new commit snapshot from the staged files.
 */
async function commitChanges(message, options = {}) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    console.error('Error: Commit message is required. Usage: groot commit <message>');
    return { success: false, error: 'Commit message is required' };
  }

  try {
    const { rootDir, grootDir } = await ensureRepoRoot();
    const stagingPath = path.join(grootDir, 'staging');
    const commitsPath = path.join(grootDir, 'commits');
    const headFile = path.join(grootDir, 'HEAD');
    const logFile = path.join(grootDir, 'log.json');

    // Check staged files
    const stagedFiles = await getRelativeFiles(stagingPath, stagingPath);
    if (stagedFiles.length === 0) {
      console.log('No changes added to commit. Use "groot add <file>" before committing.');
      return { success: false, error: 'No staged changes' };
    }

    // Read previous commit from HEAD
    let parentCommit = null;
    try {
      const headContent = (await fs.readFile(headFile, 'utf8')).trim();
      if (headContent) {
        parentCommit = headContent;
      }
    } catch {
      // HEAD may not exist yet
    }

    const commitID = uuidv4();
    const commitDir = path.join(commitsPath, commitID);
    await fs.mkdir(commitDir, { recursive: true });

    // Copy staged files to commit directory
    await copyDirectoryRecursive(stagingPath, commitDir);

    const author =
      options.author ||
      process.env.GROOT_AUTHOR ||
      process.env.USER ||
      'Groot Developer';

    const commitMetadata = {
      commitID,
      message: message.trim(),
      author,
      date: new Date().toISOString(),
      parent: parentCommit,
      files: stagedFiles,
    };

    // Save commit metadata inside the commit snapshot
    await writeJson(path.join(commitDir, 'commit.json'), commitMetadata);

    // Update HEAD
    await fs.writeFile(headFile, commitID, 'utf8');

    // Update commit history log
    const commitLog = (await readJson(logFile, [])) || [];
    commitLog.unshift({
      commitID,
      message: message.trim(),
      author,
      date: commitMetadata.date,
      parent: parentCommit,
      fileCount: stagedFiles.length,
    });
    await writeJson(logFile, commitLog);

    // Clear staging directory
    await fs.rm(stagingPath, { recursive: true, force: true });
    await fs.mkdir(stagingPath, { recursive: true });

    console.log(`[Groot commit ${commitID.slice(0, 8)}] ${message.trim()}`);
    console.log(` ${stagedFiles.length} file(s) committed.`);

    return {
      success: true,
      commitID,
      message: message.trim(),
      fileCount: stagedFiles.length,
      files: stagedFiles,
    };
  } catch (err) {
    console.error('Error creating commit:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { commitChanges };