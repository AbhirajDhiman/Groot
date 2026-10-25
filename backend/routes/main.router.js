const express = require('express');
const userRouter = require('./user.router');
const repoRouter = require('./repo.router');
const issueRouter = require('./issue.router');
const vcsRouter = require('./vcs.router');

const mainRouter = express.Router();

mainRouter.use(userRouter);
mainRouter.use(repoRouter);
mainRouter.use(issueRouter);
mainRouter.use(vcsRouter);

mainRouter.get('/', (req, res) => {
  res.json({
    name: 'Groot VCS Backend API',
    status: 'online',
    version: '1.0.0',
    documentation: {
      auth: ['POST /signup', 'POST /login', 'GET /allUsers', 'GET /userProfile/:id'],
      repos: ['POST /repo/create', 'GET /repo/all', 'GET /repo/:id', 'GET /repo/name/:name'],
      issues: ['POST /issue/create', 'GET /issue/repo/:id', 'PUT /issue/update/:id'],
      vcs: ['GET /vcs/status', 'GET /vcs/log', 'POST /vcs/stage', 'POST /vcs/commit'],
    },
  });
});

module.exports = mainRouter;
