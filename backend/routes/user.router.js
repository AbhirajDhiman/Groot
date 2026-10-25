const express = require('express');
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');

const userRouter = express.Router();

// Public routes
userRouter.post('/signup', userController.signup);
userRouter.post('/login', userController.login);
userRouter.get('/allUsers', userController.getAllUsers);
userRouter.get('/userProfile/:id', userController.getUserProfile);

// Protected routes
userRouter.put('/updateProfile/:id', authenticateToken, userController.updateUserProfile);
userRouter.delete('/deleteProfile/:id', authenticateToken, userController.deleteUserProfile);

module.exports = userRouter;
