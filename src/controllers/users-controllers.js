const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcyrpt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const SibApiV3Sdk = require('sib-api-v3-sdk');
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE;

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

const HttpError = require('../models/http-error');
const User = require('../models/user');

const JWT_KEY = process.env.JWT_KEY;

const getUsers = async (req, res, next) => {
	try {
		// exclusing the -password with 'projection'
		const users = await User.find({}, '-password');

		if (!users) {
			return new HttpError('Could not fetch users', 422);
		}

		return res.status(200).json({
			results: users.map((user) => user.toObject({ getters: true }))
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

const getUserById = async (req, res, next) => {
	try {
		const userId = req.params.uid;
		const user = await User.findById({ _id: userId }, '-password');

		if (!user) {
			return new HttpError('Could not find user', 404);
		}

		return res.status(200).json({
			result: user.toObject({ getters: true })
		});
	} catch (error) {
		console.log('Unable to fetch user____');
		// return next(new HttpError(error.message, error.code));
		// return next(new HttpError('Could not find user', 404));
		return res.status(404).json({
			message: 'Unable to find user'
		});
	}
};

const signup = async (req, res, next) => {
	console.log('_____SIGN UP REQUEST RECEIVED_____');
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

	const idx = new Date().toISOString();

	try {
		sendSmtpEmail.subject = 'Jtaclogs signup confirmation';
		sendSmtpEmail.to = [{ email: `${email}`, name: `${name}` }];
		sendSmtpEmail.replyTo = {
			email: process.env.JTACLOGS_ADMIN,
			name: 'Jtaclogs admin'
		};
		sendSmtpEmail.htmlContent = `<html>
				\
				<body>
					\<h3>Succesful sign up for ${name} with Jtaclogs!</h3>\
					<div>
						Thanks for signing up. Be aware that the app running on Jtaclogs is
						using a third party API: unogsNg from ${process.env.RAPIDAPI} for fetching the Netflix content. We do not
                        control the outcome or sudden changes made by this third party.
                        <br />
                        We also would like to point out that for some countries there is no Netflix data available. Which countries this concerns is unclear at the moment. Should you not be able to find the country of your choice, then there probably is no content available for it.
						<br />
						<br />
						We hope you enjoy our app and its content.
						<br />
						<br />
						Greetings from the Jatclogs team! (...which is actually just one
						person)
					</div>
					\
				</body>
				\
			</html>`;
		sendSmtpEmail.sender = {
			name: 'Jtaclogs admin',
			email: process.env.JTACLOGS_ADMIN
		};

		await apiInstance.sendTransacEmail(sendSmtpEmail);
	} catch (error) {
		console.log('Error sending email______>', error);
	}

	return res.status(201).json({
		user: newUser,
		userId: createdUser.id,
		email: createdUser.email,
		token: token
	});
};

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

	try {
		existingUser = await User.findOne({ email: email });
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	if (!existingUser) {
		return next(new HttpError('Authentication failed - Unable to login', 401));
	}

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

	let userFavorites;

	try {
		userFavorites = await User.findById(existingUser._id).populate('favorites');
	} catch (error) {
		return next(
			new HttpError('Could not find any favorites for the provided id', 404)
		);
	}

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

const updateUser = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		console.log('____UPDATE USER____error__', errors);
		return next(
			new HttpError(
				'Invalid inputs were passed, please check your input data',
				422
			)
		);
	}
	const { username, email, country } = req.body;
	const userId = req.params.uid;

	if (username || email || country) {
		console.log('__TRYING TO UPDATE___::', username, email, country);
	} else if (req.file) {
		console.log('_____SETTING NEW PROFILE IMG_____');
	}

	let updatedUser;

	try {
		updatedUser = await User.findById(userId);
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	if (!updatedUser) {
		return next(new HttpError('Could not find a user for that id.', 404));
	}

	if (req.file) {
		updatedUser.name;
		updatedUser.email;
		updatedUser.country;
		updatedUser.image = req.file.path;
		console.log('____UPDATE USER______');
	}
	if (!req.file) {
		updatedUser.name = username;
		updatedUser.email = email;
		updatedUser.country = country || updatedUser.country;
	}
	try {
		await updatedUser.save();
	} catch (error) {
		return next(new HttpError('Could not update user.', 500));
	}

	setTimeout(() => {
		return res.status(200).json({
			updatedUser: updatedUser.toObject({ getters: true })
		});
	}, 2000);
};

exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.signup = signup;
exports.login = login;
exports.updateUser = updateUser;
