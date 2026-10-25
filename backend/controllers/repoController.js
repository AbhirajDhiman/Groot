const mongoose = require('mongoose');
const Repository = require('../models/repoModel');
const User = require('../models/userModel');
const Issue = require('../models/issueModel');

/**
 * Creates a new remote repository entry in Groot.
 */
async function createRepository(req, res) {
  const { owner, name, description, visibility, content, issues } = req.body;

  try {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Repository name is required' });
    }

    const ownerId = owner || (req.user && req.user.id);
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ error: 'Valid Owner User ID is required' });
    }

    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(404).json({ error: 'Owner user does not exist' });
    }

    const existingRepo = await Repository.findOne({ name: name.trim() });
    if (existingRepo) {
      return res.status(400).json({ error: `Repository with name "${name.trim()}" already exists` });
    }

    const newRepository = new Repository({
      name: name.trim(),
      description: description || '',
      visibility: visibility !== undefined ? visibility : true,
      owner: ownerId,
      content: Array.isArray(content) ? content : [],
      issues: Array.isArray(issues) ? issues : [],
    });

    const savedRepo = await newRepository.save();

    // Link repo to owner's repositories array
    user.repositories.push(savedRepo._id);
    await user.save();

    res.status(201).json({
      message: 'Groot repository created successfully!',
      repositoryID: savedRepo._id,
      repository: savedRepo,
    });
  } catch (err) {
    console.error('Error creating repository:', err);
    res.status(500).json({ error: 'Server error during repository creation', details: err.message });
  }
}

/**
 * Retrieves all repositories with owner and issues populated.
 */
async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({})
      .populate('owner', 'username email')
      .populate('issues');

    res.json(repositories);
  } catch (err) {
    console.error('Error fetching repositories:', err);
    res.status(500).json({ error: 'Server error fetching repositories', details: err.message });
  }
}

/**
 * Retrieves a repository by its unique ObjectId.
 */
async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Repository ID format' });
    }

    const repository = await Repository.findById(id)
      .populate('owner', 'username email')
      .populate('issues');

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    res.json(repository);
  } catch (err) {
    console.error('Error fetching repository:', err);
    res.status(500).json({ error: 'Server error fetching repository', details: err.message });
  }
}

/**
 * Retrieves a repository by its name.
 */
async function fetchRepositoryByName(req, res) {
  const { name } = req.params;

  try {
    if (!name) {
      return res.status(400).json({ error: 'Repository name parameter is required' });
    }

    const repository = await Repository.findOne({ name: name.trim() })
      .populate('owner', 'username email')
      .populate('issues');

    if (!repository) {
      return res.status(404).json({ error: `Repository "${name}" not found` });
    }

    res.json(repository);
  } catch (err) {
    console.error('Error fetching repository by name:', err);
    res.status(500).json({ error: 'Server error fetching repository', details: err.message });
  }
}

/**
 * Retrieves all repositories owned by a specific user.
 */
async function fetchRepositoriesForCurrentUser(req, res) {
  const { userID } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    const repositories = await Repository.find({ owner: userID })
      .populate('owner', 'username email')
      .populate('issues');

    res.json({
      message: 'Repositories fetched successfully',
      count: repositories.length,
      repositories,
    });
  } catch (err) {
    console.error('Error fetching user repositories:', err);
    res.status(500).json({ error: 'Server error fetching user repositories', details: err.message });
  }
}

/**
 * Updates repository metadata (content, description).
 */
async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Repository ID format' });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    if (content !== undefined) {
      if (Array.isArray(content)) {
        repository.content = content;
      } else {
        repository.content.push(content);
      }
    }

    if (description !== undefined) {
      repository.description = description;
    }

    const updatedRepository = await repository.save();

    res.json({
      message: 'Repository updated successfully!',
      repository: updatedRepository,
    });
  } catch (err) {
    console.error('Error updating repository:', err);
    res.status(500).json({ error: 'Server error updating repository', details: err.message });
  }
}

/**
 * Toggles public/private repository visibility.
 */
async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Repository ID format' });
    }

    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    repository.visibility = !repository.visibility;
    const updatedRepository = await repository.save();

    res.json({
      message: `Repository visibility updated to ${updatedRepository.visibility ? 'Public' : 'Private'}`,
      repository: updatedRepository,
    });
  } catch (err) {
    console.error('Error toggling repository visibility:', err);
    res.status(500).json({ error: 'Server error toggling visibility', details: err.message });
  }
}

/**
 * Deletes repository and cleans up references.
 */
async function deleteRepositoryById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Repository ID format' });
    }

    const repository = await Repository.findByIdAndDelete(id);
    if (!repository) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    // Clean up owner's reference
    await User.findByIdAndUpdate(repository.owner, {
      $pull: { repositories: repository._id },
    });

    // Delete associated issues
    await Issue.deleteMany({ repository: repository._id });

    res.json({ message: 'Repository and associated issues deleted successfully!' });
  } catch (err) {
    console.error('Error deleting repository:', err);
    res.status(500).json({ error: 'Server error deleting repository', details: err.message });
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
};
