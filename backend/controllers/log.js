const fs = require('fs').promises;
const path = require('path');
const { ensureRepoRoot, readJson } = require('../utils/repoUtils');

/**
 * Displays the commit history of the repository.
 */
async function showLog(options = {}) {
  try {
    const { grootDir } = await ensureRepoRoot();
    const logFile = path.join(grootDir, 'log.json');
    let commits = await readJson(logFile, null);

    // Fallback: If log.json is empty or missing, rebuild history from commits directory
    if (!commits || !Array.isArray(commits) || commits.length === 0) {
      commits = [];
      const commitsDir = path.join(grootDir, 'commits');
      try {
        const entries = await fs.readdir(commitsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const commitJsonPath = path.join(commitsDir, entry.name, 'commit.json');
            const data = await readJson(commitJsonPath);
            if (data) {
              commits.push(data);
            }
          }
        }
        commits.sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch {
        // no commits directory yet
      }
    }

    if (commits.length === 0) {
      console.log('No commits found in this repository yet.');
      return { success: true, commits: [] };
    }

    const limit = options.limit || commits.length;
    const displayedCommits = commits.slice(0, limit);

    console.log(`\n=== Groot Commit History (${displayedCommits.length} of ${commits.length}) ===\n`);
    for (const c of displayedCommits) {
      console.log(`commit \x1b[33m${c.commitID}\x1b[0m`);
      if (c.author) {
        console.log(`Author: ${c.author}`);
      }
      console.log(`Date:   ${new Date(c.date).toLocaleString()}`);
      if (c.parent) {
        console.log(`Parent: ${c.parent.slice(0, 8)}`);
      }
      console.log(`\n    ${c.message}\n`);
    }

    return { success: true, commits: displayedCommits };
  } catch (err) {
    console.error('Error reading commit log:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { showLog };
