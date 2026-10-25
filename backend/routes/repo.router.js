const express = require('express');
const repoController = require('../controllers/repoController');
const authenticateToken = require('../middleware/authMiddleware');

const repoRouter = express.Router();

// Public routes
repoRouter.get('/repo/all', repoController.getAllRepositories);
repoRouter.get('/repo/name/:name', repoController.fetchRepositoryByName);
repoRouter.get('/repo/user/:userID', repoController.fetchRepositoriesForCurrentUser);
repoRouter.get('/repo/:id', repoController.fetchRepositoryById);

// Protected routes (or open if testing without token)
repoRouter.post('/repo/create', repoController.createRepository);
repoRouter.put('/repo/update/:id', repoController.updateRepositoryById);
repoRouter.patch('/repo/toggle/:id', repoController.toggleVisibilityById);
repoRouter.delete('/repo/delete/:id', repoController.deleteRepositoryById);

module.exports = repoRouter;
