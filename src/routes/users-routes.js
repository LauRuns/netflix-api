const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');
const usersController = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload.js');

router.post(
	'/signup',
	fileUpload.single('image'),
	[
		check('name').not().isEmpty(),
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 5 }),
		check('country').not().isEmpty()
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

// Setting the Auth middleware; routes below should only be available when authorized
router.use(checkAuth);

router.get('/:uid', usersController.getUserById);

router.patch('/:uid', fileUpload.single('image'), usersController.updateUser);

module.exports = router;
