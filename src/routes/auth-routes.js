const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');
const authController = require('../controllers/auth-controller');
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
	authController.signup
);

router.post(
	'/login',
	[
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 5 })
	],
	authController.login
);

/* Reset route should always be avaliable */
router.post(
	'/reset',
	[check('email').normalizeEmail().isEmail()],
	authController.sendResetPwdLink
);

/* Posting a new password iot reset the users password */
router.post(
	'/reset/pwd/:token',
	check('newPassword').isLength({ min: 5 }),
	authController.resetPwd
);

/* Setting the Auth middleware; route below should only be available when authorized */
// uncomment  next line to enable of disabled authentication for routes below it
router.use(checkAuth);

/* Route for updating the users credentials like name/email/avatar-image */
router.patch(
	'/update/:uid',
	[check('email').normalizeEmail().isEmail()],
	check('newPassword').isLength({ min: 5 }),
	authController.updatePwd
);

module.exports = router;
