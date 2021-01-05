const express = require('express');
const router = express.Router();

const { check } = require('express-validator');

const usersController = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload.js');

// should be available only for testing
router.get('/', usersController.getUsers);

router.post(
	'/signup',
	fileUpload.single('image'),
	[
		check('name').not().isEmpty(),
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 5 })
		// check('country').not().isEmpty()
	],
	usersController.signup
);

router.post(
	'/login',
	[
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 5 })
	],
	usersController.login
);

// Setting the Auth middleware; route below should only be available when authorized
// uncomment  next line to enable authentication for routes
// router.use(checkAuth);

router.get('/:uid', usersController.getUserById);

router.patch('/:uid', fileUpload.single('image'), usersController.updateUser);

module.exports = router;
