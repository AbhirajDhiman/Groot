const fs = require('fs').promises;
const path = require('path');
const { writeJson } = require('../utils/repoUtils');

/**
 * Initializes a new Groot repository in the target directory (defaults to process.cwd()).
 */
async function initRepo(targetDir = process.cwd()) {
  const baseDir = path.resolve(targetDir);
  const repoPath = path.join(baseDir, '.groot');
  const commitsPath = path.join(repoPath, 'commits');
  const stagingPath = path.join(repoPath, 'staging');

  try {
    // Check if repository already exists
    let exists = false;
    try {
      const stat = await fs.stat(repoPath);
      if (stat.isDirectory()) {
        exists = true;
      }
    } catch (e) {
      // Check legacy .Groot as well
      try {
        const legacyStat = await fs.stat(path.join(baseDir, '.Groot'));
        if (legacyStat.isDirectory()) {
          exists = true;
        }
      } catch (le) {
        exists = false;
      }
    }

    await fs.mkdir(repoPath, { recursive: true });
    await fs.mkdir(commitsPath, { recursive: true });
    await fs.mkdir(stagingPath, { recursive: true });

    // Initialize config.json
    await writeJson(path.join(repoPath, 'config.json'), {
      bucket: process.env.S3_BUCKET || 'groot-default-bucket',
      version: '1.0.0',
      initializedAt: new Date().toISOString(),
    });

    // Initialize empty commit log and HEAD pointer if not already present
    const headFile = path.join(repoPath, 'HEAD');
    try {
      await fs.access(headFile);
    } catch {
      await fs.writeFile(headFile, '', 'utf8');
    }

    const logFile = path.join(repoPath, 'log.json');
    try {
      await fs.access(logFile);
    } catch {
      await writeJson(logFile, []);
    }

    if (exists) {
      console.log(`Reinitialized existing Groot repository in ${repoPath}`);
    } else {
      console.log(`Initialized empty Groot repository in ${repoPath}`);
    }

    return { success: true, repoPath };
  } catch (err) {
    console.error('Error initializing Groot repository:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { initRepo };