const express = require('express');
const { check } = require('express-validator');

const router = express.Router();

const destinationController = require('../controllers/destination-controller');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

router.use(checkAuth);

router.get('/:did', destinationController.getDestinationById);
router.get('/user/:uid', destinationController.getDestinationsByUserId);

router.post(
    '/',
    fileUpload.single('image'),
    [
        check('title')
            .not()
            .isEmpty(),
        check('description').isLength({ min: 5 }),
        check('address')
            .not()
            .isEmpty()
    ],
    destinationController.createDestination);

router.patch(
    '/:did',
    [
        check('title')
            .not()
            .isEmpty(),
        check('description').isLength({ min: 5 }),
    ],
    destinationController.updateDestination
);

router.delete('/:did', destinationController.deleteDestination);

module.exports = router;
