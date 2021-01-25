const jwt = require('jsonwebtoken');
const JWT_KEY = process.env.JWT_KEY;
const HttpError = require('../models/http-error');

/*
Middleware to check if a Authetication token was added in the header.
When present, the token will be decoded and the user data is extracted and set in a userData object on the request
This object is available for the methods to follow
 */
module.exports = (req, res, next) => {
	if (req.method === 'OPTIONS') {
		return next();
	}

	try {
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			return next(new HttpError('Authentication failed', 401));
		}
		const token = authHeader.split(' ')[1];

		const decodedToken = jwt.verify(token, JWT_KEY);
		if (!decodedToken) {
			const error = new Error('Authentication failed');
			error.status = 401;
			throw error;
		}

		req.userData = { email: decodedToken.email, userId: decodedToken.userId };
		next();
	} catch (error) {
		return next(new HttpError('Authentication failed: ' + error.message, 401));
	}
};
