const mongoose = require('mongoose');
const User = require('../models/userModel');
const { hashPassword, comparePassword, generateToken } = require('../utils/authUtils');

/**
 * Registers a new user.
 */
async function signup(req, res) {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      repositories: [],
      followedUsers: [],
      starRepos: [],
    });

    const savedUser = await newUser.save();
    const token = generateToken({ id: savedUser._id, username: savedUser.username });

    res.status(201).json({
      message: 'User registered successfully!',
      token,
      userId: savedUser._id,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
      },
    });
  } catch (err) {
    console.error('Error during user signup:', err);
    res.status(500).json({ error: 'Server error during signup', details: err.message });
  }
}

/**
 * Authenticates user credentials and returns a JWT token.
 */
async function login(req, res) {
  const { email, username, password } = req.body;

  try {
    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Email or username and password are required' });
    }

    const query = email ? { email } : { username };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user._id, username: user.username });
    res.json({
      message: 'Login successful!',
      token,
      userId: user._id,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
}

/**
 * Fetches all registered users (excluding sensitive password data).
 */
async function getAllUsers(req, res) {
  try {
    const users = await User.find({})
      .select('-password')
      .populate('repositories', 'name description visibility');

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error fetching users', details: err.message });
  }
}

/**
 * Fetches user profile by user ID.
 */
async function getUserProfile(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('repositories')
      .populate('followedUsers', 'username email')
      .populate('starRepos');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Server error fetching user profile', details: err.message });
  }
}

/**
 * Updates user profile information.
 */
async function updateUserProfile(req, res) {
  const { id } = req.params;
  const { email, password } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    const updateFields = {};
    if (email) updateFields.email = email;
    if (password) {
      updateFields.password = await hashPassword(password);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ error: 'Server error updating profile', details: err.message });
  }
}

/**
 * Deletes user account and profile.
 */
async function deleteUserProfile(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid User ID format' });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User profile deleted successfully' });
  } catch (err) {
    console.error('Error deleting user profile:', err);
    res.status(500).json({ error: 'Server error deleting profile', details: err.message });
  }
}

module.exports = {
  signup,
  login,
  getAllUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
};
