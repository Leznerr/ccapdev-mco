const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// get all users
router.get('/', userController.getAllUsers);

// get a single user by ID
router.get('/:id', userController.getUserById);

// create a new user
router.post('/', userController.createUser);

// update a user by ID
router.put('/:id', userController.updateUser);

// delete a user by ID
router.delete('/:id', userController.deleteUser);

module.exports = router;