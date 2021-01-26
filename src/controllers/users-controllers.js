const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');
const User = require('../models/user');

/* Returns a single user based on the ID passed in as a paramater */
const getUserById = async (req, res, next) => {
	try {
		const userId = req.params.uid;
		/* Exclude the hashed password form the result - password */
		const user = await User.findById({ _id: userId }, '-password');

		if (!user) {
			return new HttpError('Could not find user', 404);
		}

		return res.status(200).json({
			result: user.toObject({ getters: true })
		});
	} catch (error) {
		return res.status(404).json({
			message: 'Unable to find user'
		});
	}
};

/*
Update a users name, email or image
*/
const updateUser = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError(
				'Invalid inputs were passed, please check your input data',
				422
			)
		);
	}
	const { username, email, country } = req.body;
	const userId = req.params.uid;

	/* Fetch the user from the database */
	let updatedUser;
	try {
		updatedUser = await User.findById(userId);
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	if (!updatedUser) {
		return next(new HttpError('Could not find a user for that id.', 404));
	}

	/* Checks if a file is present on the request */
	if (req.file) {
		updatedUser.name;
		updatedUser.email;
		updatedUser.country;
		updatedUser.image = req.file.path;
	}
	if (!req.file) {
		updatedUser.name = username;
		updatedUser.email = email;
		updatedUser.country = country || updatedUser.country;
	}

	/* Save the updated user to the database */
	try {
		await updatedUser.save();
	} catch (error) {
		return next(new HttpError('Could not update user.', 500));
	}

	/* Return the updated user */
	return res.status(200).json({
		updatedUser: updatedUser.toObject({ getters: true })
	});
};

exports.getUserById = getUserById;
exports.updateUser = updateUser;
