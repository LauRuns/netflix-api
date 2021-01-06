const express = require('express');
const { check } = require('express-validator');

const router = express.Router();

const favoritesController = require('../controllers/favorites-controller');
const checkAuth = require('../middleware/check-auth');

router.use(checkAuth);

router.get('/user/:uid', favoritesController.getFavoritesByUserId);

router.post(
	'/',
	[check('title').not().isEmpty(), check('nfid').not().isEmpty()],
	favoritesController.addFavorite
);

router.delete('/:fid', favoritesController.deleteFavoriteItem);

module.exports = router;
