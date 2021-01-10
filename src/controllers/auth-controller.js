const bcyrpt = require('bcryptjs');
const { validationResult } = require('express-validator');
const mailer = require('../utils/mailer');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const tokenGenerator = require('../utils/resetToken');

/*
Password update
Checks if user has provided the correct data for updating like email and a new password
Fetches the user fom the database based on the provided email
Hashes the new password and writes it to the database
*/
const updatePwd = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError(
				'Invalid inputs were passed, please check your input data',
				422
			)
		);
	}

	try {
		const { email, oldPassword, newPassword, confirmNewPassword } = req.body;
		const { userId } = req.params;

		/* Check if user-id param is same as logged in user-id send with token */
		try {
			if (!!userId) {
				return next(
					new HttpError('Authentication failed, unable to update password', 403)
				);
			}
		} catch (error) {
			return next(new HttpError(error.message, 500));
		}

		if (newPassword !== confirmNewPassword) {
			return next(
				new HttpError('New password does not match confirm password', 422)
			);
		}

		/* Check if user exists in database */
		let existingUser;
		try {
			existingUser = await User.findOne({ email: email });
			if (!existingUser) {
				return next(new HttpError('Could not find user.', 404));
			}
		} catch (error) {
			return next(
				new HttpError('Internal server error, unable to update', 500)
			);
		}

		/* Check if old password provided in body is the same as the one on the database */
		let isValidPassword = false;
		try {
			isValidPassword = await bcyrpt.compare(
				oldPassword,
				existingUser.password
			);
		} catch (error) {
			return next(new HttpError('Server error', 500));
		}

		if (!isValidPassword) {
			return next(
				new HttpError(
					'Invalid credentials, authentication failed - check inputs',
					500
				)
			);
		}

		/* Hash the new password and save it to the existing user */
		let newHashedPassword;
		try {
			newHashedPassword = await bcyrpt.hash(newPassword, 12);

			/* Save the new hashed password to the user */
			existingUser.password = newHashedPassword;
			await existingUser.save();
		} catch (error) {
			return next(
				new HttpError('Server error, unable to create new password', 500)
			);
		}

		return res.status(200).json({
			message: `${existingUser.name}, your password was updated!`
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

/*
Send a link to the user which redirects to the password resetting page
Middleware checks if user has provided the correct data
Fetches the user from the database and if all criterias are met, an emai with link is send
*/
const sendResetPwdLink = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(new HttpError('No email was provided', 422));
	}
	const email = req.body.email;
	let user;
	let rToken;

	if (!email) {
		return next(new HttpError('No email was found on the request', 404));
	}
	try {
		user = await User.findOne({ email: email });
		if (!user) {
			return next(
				new HttpError(`Could not find user for email: ${email}`, 404)
			);
		}
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	/* Sets a resetToken and expiry time for the user which is only valid for 15 min */
	try {
		rToken = await tokenGenerator.generateResetToken();
		if (!rToken) {
			return next(new HttpError('An unexpected server error occurred', 500));
		}
		user.resetToken = rToken;
		user.resetTokenExpiration = Date.now() + 900000; // 15 min valid
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	/* Save the resetToken and its expiry time to the user in the database */
	try {
		await user.save();
		await mailer.resetPasswordMail({
			email: user.email,
			resetLink: `${process.env.REMOTE_CONNECTION_STRING}/reset/${rToken}`
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	return res.status(200).json({
		message: `A recovery link was send to ${email}. It is valid until ${new Date(
			Date.now() + 900000
		).toLocaleTimeString()}`
	});
};

/*
Resets the user password
User must provide a new password, confirm password
The resetToken is passed as a parameter in the url. The token is matched against all present resetTokens
in the database. If a match, then the password will be reset for that user
*/
const resetPwd = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError(
				'An incorrect new password was provided - unprocessable entity',
				422
			)
		);
	}

	const token = req.params.token;
	const newPassword = req.body.newPassword;
	const confirmNewPassword = req.body.confirmNewPassword;

	let resetUser;
	let hashedNewPassword;

	if (!token) {
		return new HttpError('An incorrect token was passed', 401);
	}
	if (newPassword !== confirmNewPassword) {
		return new HttpError('The new and confirmed password do not match', 403);
	}

	/* Fetch user from database */
	try {
		resetUser = await User.findOne({ resetToken: token });
		if (!resetUser) {
			return next(
				new HttpError(
					`Could not find user - an incorrect token was passed`,
					401
				)
			);
		}
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	if (resetUser.resetTokenExpiration < Date.now()) {
		return next(
			new HttpError(
				`You're reset link is no longer valid. Please request another reset link`,
				403
			)
		);
	}

	/* Has the new password */
	try {
		hashedNewPassword = await bcyrpt.hash(newPassword, 12);
		if (!hashedNewPassword) {
			return next(new HttpError(`An unexpected server error occurred`, 500));
		}
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	/* Save the updated password to the user and set the reset token and expiration time back to undefind */
	try {
		resetUser.password = hashedNewPassword;
		resetUser.resetToken = undefined;
		resetUser.resetTokenExpiration = undefined;
		await resetUser.save();
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	return res.status(200).json({
		message: `Password for ${resetUser.email} was succesfully reset.`
	});
};

exports.updatePwd = updatePwd;
exports.sendResetPwdLink = sendResetPwdLink;
exports.resetPwd = resetPwd;
