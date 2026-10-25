const fs = require('fs').promises;
const path = require('path');
const { initRepo } = require('./init');
const { addFile } = require('./add');
const { commitChanges } = require('./commit');
const { repoStatus } = require('./status');
const { showLog } = require('./log');
const { revertCommit } = require('./revert');
const { ensureRepoRoot, readJson, getRelativeFiles } = require('../utils/repoUtils');

/**
 * REST API Controller exposing Groot Version Control capabilities over HTTP.
 */
async function getStatus(req, res) {
  try {
    const status = await repoStatus();
    if (!status.success) {
      return res.status(400).json(status);
    }
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve repository status', details: err.message });
  }
}

async function getLog(req, res) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const history = await showLog({ limit });
    if (!history.success) {
      return res.status(400).json(history);
    }
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve commit history', details: err.message });
  }
}

async function getCommitDetails(req, res) {
  const { commitID } = req.params;

  try {
    const { grootDir } = await ensureRepoRoot();
    const commitDir = path.join(grootDir, 'commits', commitID);

    const metadata = await readJson(path.join(commitDir, 'commit.json'));
    if (!metadata) {
      return res.status(404).json({ error: `Commit ${commitID} not found` });
    }

    const files = await getRelativeFiles(commitDir, commitDir, ['commit.json']);
    res.json({
      commit: metadata,
      files,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch commit details', details: err.message });
  }
}

async function apiInitRepo(req, res) {
  const targetDir = req.body.directory || process.cwd();
  try {
    const result = await initRepo(targetDir);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to initialize repository', details: err.message });
  }
}

async function apiStageFiles(req, res) {
  const { files } = req.body;
  if (!files) {
    return res.status(400).json({ error: 'Files array or path is required' });
  }

  try {
    const result = await addFile(files);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to stage files', details: err.message });
  }
}

async function apiCommitChanges(req, res) {
  const { message, author } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Commit message is required' });
  }

  try {
    const result = await commitChanges(message, { author });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create commit', details: err.message });
  }
}

async function apiRevertCommit(req, res) {
  const commitID = req.params.commitID || req.body.commitID;
  if (!commitID) {
    return res.status(400).json({ error: 'Commit ID is required' });
  }

  try {
    const result = await revertCommit(commitID);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to revert commit', details: err.message });
  }
}

module.exports = {
  getStatus,
  getLog,
  getCommitDetails,
  apiInitRepo,
  apiStageFiles,
  apiCommitChanges,
  apiRevertCommit,
};
