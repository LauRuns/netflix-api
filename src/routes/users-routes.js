const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const usersController = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload.js');

// Setting the Auth middleware; routes below should only be available when authorized
router.use(checkAuth);

router.get('/:uid', usersController.getUserById);

router.patch('/:uid', fileUpload.single('image'), usersController.updateUser);

module.exports = router;
