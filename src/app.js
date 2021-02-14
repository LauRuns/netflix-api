const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const HttpError = require('./models/http-error');

/* Route references */
const authRoutes = require('./routes/auth-routes');
const favoritesRoutes = require('./routes/favorites-routes');
const userRoutes = require('./routes/users-routes');

const app = express();

const accessLogStream = fs.createWriteStream(
	path.join(__dirname, 'access.log'),
	{ flags: 'a' }
);

app.use(helmet());
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.json());
app.use(cookieParser());

/* Returns static files - requested images */
app.use(
	'/src/uploads/images',
	express.static(path.join('src', 'uploads', 'images'))
);

/* Handle CORS - prior to passing it to the routes */
app.use((req, res, next) => {
	/*
	Set Access-Control-Allow-Origin only for specific domains by uncommenting below and comment line 47
	By doing so, only domains listed below are accessible, make sure you have added your domain!
	*/
	// let uri = req.headers.origin;
	// if (
	// 	uri === 'http://localhost:3000' ||
	// 	uri === 'http://localhost:8082' ||
	// 	uri === 'https://jtaclogs.nl'
	// ) {
	// 	res.setHeader('Access-Control-Allow-Origin', `${uri}`);
	// }
	res.setHeader('Access-Control-Allow-Origin', `${req.headers.origin}`);
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	if (req.method === 'OPTIONS') {
		res.header(
			'Access-Control-Allow-Methods',
			'GET, POST, PATCH, PUT, DELETE, OPTIONS'
		);
	}
	next();
});

/* Routes to handle requests */
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/users', userRoutes);

/* Middleware for unsupported routes */
app.use((req, res, next) => {
	next(new HttpError('Unsupported route', 404));
});

/* General Error handling */
app.use((error, req, res, next) => {
	/*
    Remove file if a validation error occurrs during sign-up
    Only applicable if a user image is set on sign up
    */
	if (req.file) {
		fs.unlink(req.file.path, (err) => {
			console.log('File deletion:', err);
		});
	}

	if (res.headerSent) {
		return next(error);
	}

	return res.status(error.code || 500).json({
		message: error.message || 'An unexpected error occurred'
	});
});

module.exports = app;
