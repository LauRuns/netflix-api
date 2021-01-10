const multer = require('multer');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const HttpError = require('../models/http-error');
const NetflixItem = require('../models/netflix-item');
const User = require('../models/user');

/*
Returns a list [] of favorite Netflix items from the user based on the user ID that is passed in as a parameter
*/
const getFavoritesByUserId = async (req, res, next) => {
	const userId = req.params.uid;
	let userFavorites;

	try {
		userFavorites = await User.findById(userId).populate('favorites');
	} catch (error) {
		return next(
			new HttpError('Could not find any favorites for the provided id', 404)
		);
	}
	if (!userFavorites || userFavorites.length === 0) {
		return next(
			new HttpError('Could not find a favorites for the provided user id.', 404)
		);
	}

	/* Return the results to the user */
	return res.status(200).json({
		result: userFavorites.favorites.map((favorite) =>
			favorite.toObject({ getters: true })
		)
	});
};

/* Adds a favorite to the favorites list of a user */
const addFavorite = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			HttpError(
				'Invalid data was passed, please check the data that was send',
				422
			)
		);
	}

	let createdFavorite;
	let user;
	const { nfid, title, year, synopsis, img, imdbrating } = req.body;

	createdFavorite = new NetflixItem({
		nfid: nfid,
		title: title,
		synopsis: synopsis,
		year: year,
		imdbrating: imdbrating,
		img: img,
		creator: req.userData.userId
	});

	/* Fetch user based on ID from parameter */
	try {
		user = await User.findById(req.userData.userId);
	} catch (error) {
		return next(error);
	}

	/*
    Create a rollback scenario for MongoDB useing Mongoose
    Save the new favorite to the user
    If an error occurs trying to perform this action, then the action is 'rolled back'
    */
	try {
		const session = await mongoose.startSession();
		session.startTransaction();
		await createdFavorite.save({ sessions: session });
		await user.favorites.push(createdFavorite);
		await user.save({ session: session });
		await session.commitTransaction();
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	/* Return the results to the user */
	return res.status(201).json({
		favorite: createdFavorite
	});
};

/* Deletes one of the favorite items based on its ID passed in as a parameter */
const deleteFavoriteItem = async (req, res, next) => {
	const favoriteId = req.params.fid;
	let favorite;

	try {
		favorite = await NetflixItem.findById(favoriteId).populate('creator');
	} catch (error) {
		return next(error);
	}

	if (!favorite) {
		return next(new HttpError('Could not find favorite for this id', 404));
	}

	if (favorite.creator.id !== req.userData.userId) {
		return next(new HttpError('You are not allowed to delete this item', 401));
	}

	/*
    Create a rollback scenario for MongoDB useing Mongoose
    Delete a favorite from the user
    If an error occurs trying to perform this action, then the action is 'rolled back'
    */
	try {
		const session = await mongoose.startSession();
		session.startTransaction();
		await favorite.remove({ session: session });
		await favorite.creator.favorites.pull(favorite);
		await favorite.creator.save({ session: session });
		await session.commitTransaction();
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}

	/* Return the results to the user */
	return res.status(200).json({
		message: 'Favorite was deleted',
		result: {
			id: favorite._id,
			netflixid: favorite.nfid
		}
	});
};

exports.getFavoritesByUserId = getFavoritesByUserId;
exports.addFavorite = addFavorite;
exports.deleteFavoriteItem = deleteFavoriteItem;
