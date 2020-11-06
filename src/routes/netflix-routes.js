const express = require('express');
const { check } = require('express-validator');

const router = express.Router();

const netflixController = require('../controllers/netflix-controller');
const checkAuth = require('../middleware/check-auth');

// router.use(checkAuth);

router.get('/', netflixController.getNetflixItems);
router.get('/countries', netflixController.getNetflixCountries);
router.post('/search', netflixController.searchNetflixDB);
router.post('/search/actor', netflixController.searchNetflixDBForActor);
router.post(
	'/search/deleteditems',
	netflixController.searchNetflixDBForDeletedItems
);
router.post('/search/netflixid', netflixController.getCountriesForID);
router.post('/search/idinfo', netflixController.getInfoForID);
router.post('/search/expiring', netflixController.getExpiring);

// router.get('/:nid', netflixController.getNetflixItemById);
// router.get('/user/:uid', netflixController.getNetflixItemsByUserId);

// router.post(
//     '/',
//     [
//         check('title')
//             .not()
//             .isEmpty(),
//         check('description').isLength({ min: 5 }),
//         check('address')
//             .not()
//             .isEmpty()
//     ],
//     netflixController.saveNetflixItem);

// router.patch(
//     '/:did',
//     [
//         check('title')
//             .not()
//             .isEmpty(),
//         check('description').isLength({ min: 5 }),
//     ],
//     destinationController.updateDestination
// );

// router.delete('/:did', netflixController.deleteNetflixItem);

module.exports = router;
