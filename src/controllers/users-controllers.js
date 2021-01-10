const bcyrpt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const mailer = require('../utils/mailer');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const JWT_KEY = process.env.JWT_KEY;

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
Returns a new signed up user
User has provided the credentials in the signup form
*/
const signup = async (req, res, next) => {
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

	let parsedCountry;
	const { name, email, password, country } = req.body;
	parsedCountry = JSON.parse(country);

	/* Check if there already is a user with the provided email address in the body */
	let existingUser;
	try {
		existingUser = await User.findOne({ email: email });
		if (existingUser) {
			return next(
				new HttpError(
					'Could not create a new user because this email address already exists.',
					422
				)
			);
		}
	} catch (error) {
		return next(new HttpError('Could not create user', 500));
	}

	/* Hash the password provided by the new user */
	let hashedPassword;
	try {
		hashedPassword = await bcyrpt.hash(password, 12);
	} catch (error) {
		return next(new HttpError('Could not create user', 500));
	}

	let newUser;
	let createdUser;

	try {
		if (req.file) {
			createdUser = new User({
				name,
				email,
				image: req.file.path,
				password: hashedPassword,
				places: []
			});
		}
		if (!req.file) {
			createdUser = new User({
				name,
				email,
				image: 'src/uploads/images/no-profile-picture.jpg',
				country: parsedCountry,
				password: hashedPassword,
				places: []
			});
		}

		newUser = await createdUser.save();
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	/* Create a JWT which is send is returned to the frontend */
	let token;
	try {
		token = jwt.sign(
			{
				email: createdUser.email,
				userId: createdUser.id
			},
			JWT_KEY,
			{
				expiresIn: '1h'
			}
		);
	} catch (error) {
		return next(new HttpError(`An error occurred: ${error.message}`, 500));
	}

	/* If a token was created then a sign up confirmation email will be send and the newly created user is returned to the frontend */
	if (token) {
		try {
			await mailer.sendSignUpMail({ name: name, email: email });
		} catch (error) {
			console.log('Error sending email______>', error);
		}

		/* Returns the token and newly created user */
		return res.status(201).json({
			user: newUser,
			userId: createdUser.id,
			email: createdUser.email,
			token: token
		});
	}
};

/*
Login functionality
Checks if user exists and matches the provided password the password found in the database
*/
const login = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		console.log(errors);
		return next(
			new HttpError(
				'Authentication failed - invalid inputs were passed. Please check your input data',
				422
			)
		);
	}

	const { email, password } = req.body;
	let existingUser;

	/* Fetch user from the database using the provided email */
	try {
		existingUser = await User.findOne({ email: email });
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	if (!existingUser) {
		return next(new HttpError('Authentication failed - Unable to login', 401));
	}

	/* Compare passwords */
	let isValidPassword = false;
	try {
		isValidPassword = await bcyrpt.compare(password, existingUser.password);
	} catch (error) {
		return next(new HttpError('Authentication failed', 500));
	}

	if (!isValidPassword) {
		return next(
			new HttpError(
				'Authentication failed - please check your email and password',
				500
			)
		);
	}

	/* Create a JWT */
	let token;
	try {
		token = jwt.sign(
			{
				email: existingUser.email,
				userId: existingUser._id
			},
			JWT_KEY,
			{
				expiresIn: '1h'
			}
		);
	} catch (error) {
		return next(new HttpError(`An error occurred: ${error.message}`, 500));
	}

	/* Fetch all favorites for the user and return these as well - in the frontend both user and favorites will be set in context */
	let userFavorites;
	try {
		userFavorites = await User.findById(existingUser._id).populate('favorites');
	} catch (error) {
		return next(
			new HttpError('Could not find any favorites for the provided id', 404)
		);
	}

	/* Return user/token/favorites */
	return res.status(200).json({
		user: existingUser,
		userId: existingUser._id,
		email: existingUser.email,
		token: token,
		favorites: userFavorites.favorites.map((favorite) =>
			favorite.toObject({ getters: true })
		)
	});
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
exports.signup = signup;
exports.login = login;
exports.updateUser = updateUser;
