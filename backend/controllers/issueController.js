const mongoose = require('mongoose');
const Repository = require('../models/repoModel');
const Issue = require('../models/issueModel');

/**
 * Creates a new issue associated with a repository.
 */
async function createIssue(req, res) {
  const { title, description } = req.body;
  const repoId = req.params.id || req.body.repository;

  try {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Issue title is required' });
    }

    if (!repoId || !mongoose.Types.ObjectId.isValid(repoId)) {
      return res.status(400).json({ error: 'Valid repository ID is required' });
    }

    const repository = await Repository.findById(repoId);
    if (!repository) {
      return res.status(404).json({ error: 'Target repository not found' });
    }

    const newIssue = new Issue({
      title: title.trim(),
      description: description || '',
      status: 'open',
      repository: repoId,
    });

    const savedIssue = await newIssue.save();

    // Link issue to repository
    repository.issues.push(savedIssue._id);
    await repository.save();

    res.status(201).json({
      message: 'Issue created successfully!',
      issue: savedIssue,
    });
  } catch (err) {
    console.error('Error creating issue:', err);
    res.status(500).json({ error: 'Server error during issue creation', details: err.message });
  }
}

/**
 * Updates an issue by ID (title, description, or status).
 */
async function updateIssueById(req, res) {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Issue ID format' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    if (title !== undefined) issue.title = title.trim();
    if (description !== undefined) issue.description = description;
    if (status !== undefined) {
      if (!['open', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Status must be either "open" or "closed"' });
      }
      issue.status = status;
    }

    const updatedIssue = await issue.save();

    res.json({
      message: 'Issue updated successfully!',
      issue: updatedIssue,
    });
  } catch (err) {
    console.error('Error updating issue:', err);
    res.status(500).json({ error: 'Server error updating issue', details: err.message });
  }
}

/**
 * Deletes an issue by ID and removes reference from repository.
 */
async function deleteIssueById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Issue ID format' });
    }

    const issue = await Issue.findByIdAndDelete(id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Clean up repository's issue list
    await Repository.findByIdAndUpdate(issue.repository, {
      $pull: { issues: issue._id },
    });

    res.json({ message: 'Issue deleted successfully!' });
  } catch (err) {
    console.error('Error deleting issue:', err);
    res.status(500).json({ error: 'Server error deleting issue', details: err.message });
  }
}

/**
 * Retrieves all issues for a specific repository.
 */
async function getAllIssues(req, res) {
  const repoId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(repoId)) {
      return res.status(400).json({ error: 'Invalid Repository ID format' });
    }

    const issues = await Issue.find({ repository: repoId }).sort({ createdAt: -1 });

    res.json({
      repositoryId: repoId,
      count: issues.length,
      issues,
    });
  } catch (err) {
    console.error('Error fetching issues:', err);
    res.status(500).json({ error: 'Server error fetching issues', details: err.message });
  }
}

/**
 * Retrieves a single issue by ID.
 */
async function getIssueById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Issue ID format' });
    }

    const issue = await Issue.findById(id).populate('repository', 'name description');
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json(issue);
  } catch (err) {
    console.error('Error fetching issue:', err);
    res.status(500).json({ error: 'Server error fetching issue', details: err.message });
  }
}

module.exports = {
  createIssue,
  updateIssueById,
  deleteIssueById,
  getAllIssues,
  getIssueById,
};
