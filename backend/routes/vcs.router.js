const express = require('express');
const vcsController = require('../controllers/vcsController');

const vcsRouter = express.Router();

vcsRouter.get('/vcs/status', vcsController.getStatus);
vcsRouter.get('/vcs/log', vcsController.getLog);
vcsRouter.get('/vcs/commit/:commitID', vcsController.getCommitDetails);
vcsRouter.post('/vcs/init', vcsController.apiInitRepo);
vcsRouter.post('/vcs/add', vcsController.apiStageFiles);
vcsRouter.post('/vcs/commit', vcsController.apiCommitChanges);
vcsRouter.post('/vcs/revert/:commitID', vcsController.apiRevertCommit);
vcsRouter.post('/vcs/revert', vcsController.apiRevertCommit);

module.exports = vcsRouter;
