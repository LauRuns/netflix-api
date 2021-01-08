const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/auth-controller');

/* Reset route should always be avaliable */
router.post(
	'/reset',
	[check('email').normalizeEmail().isEmail()],
	authController.sendResetPwdLink
);

router.post(
	'/reset/pwd/:token',
	check('newPassword').isLength({ min: 5 }),
	authController.resetPwd
);
// Setting the Auth middleware; route below should only be available when authorized
// uncomment  next line to enable authentication for routes
router.use(checkAuth);

router.patch(
	'/update/:uid',
	[check('email').normalizeEmail().isEmail()],
	check('newPassword').isLength({ min: 5 }),
	authController.updatePwd
);

module.exports = router;
