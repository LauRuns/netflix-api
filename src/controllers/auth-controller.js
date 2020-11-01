const express = require('express');
const bcyrpt = require('bcryptjs');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const updatePwd = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		console.log(errors);
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

		console.log(email, oldPassword, newPassword, confirmNewPassword);

		// Check if user-id param is same as logged in user-id send with token
		// Auth middleware must be enabled
		try {
			if (!!userId) {
				// if (req.userData.userId !== userId) {
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

		// Check if user exists in database
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

		// Check if old password provided in body is the same as the one on the database
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

		// Hash the new password and save it to the existing user
		let newHashedPassword;
		try {
			newHashedPassword = await bcyrpt.hash(newPassword, 12);

			// Save the new hashed password to the user
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

exports.updatePwd = updatePwd;
