const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const favoritesController = require('../controllers/favorites-controller');
const checkAuth = require('../middleware/check-auth');

/* Middleware that checks if user is authenticated */
router.use(checkAuth);

/* Fetches the favorites based on a user ID */
router.get('/user/:uid', favoritesController.getFavoritesByUserId);

/*
Adds a new favorite to the favorites list of a user
A favoroites object must be provided
*/
router.post(
	'/',
	[check('title').not().isEmpty(), check('nfid').not().isEmpty()],
	favoritesController.addFavorite
);

/*
Deletes a favorites from the users list of favorites
*/
router.delete('/:fid', favoritesController.deleteFavoriteItem);

module.exports = router;
