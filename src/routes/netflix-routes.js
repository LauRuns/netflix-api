const express = require('express');
const { check } = require('express-validator');


const router = express.Router();

const netflixController = require('../controllers/netflix-controller');
const checkAuth = require('../middleware/check-auth');

// router.use(checkAuth);

router.get('/', netflixController.getNetflixItems);
router.get('/countries', netflixController.getNetflixCountries);
router.get('/search', netflixController.searchNetflixDB);
router.get('/search/actor', netflixController.searchNetflixDBForActor);
router.get('/search/deleteditems', netflixController.searchNetflixDBForDeletedItems);
router.get('/search/netflixid', netflixController.getCountriesForID);
router.get('/search/expiring', netflixController.getExpiring);

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