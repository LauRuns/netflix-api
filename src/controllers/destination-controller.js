const multer = require('multer');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../utils/location');
const Destination = require('../models/destination');
const User = require('../models/user');


const getDestinationById = async (req, res, next) => {
    const destinationId = req.params.did;

    let destination;

    try {
        destination = await Destination.findById(destinationId);
    } catch (error) {
        return next(
            new HttpError(`Could not find a destination for id: ${destinationId}`, 404)
        );
    }
    if (!destination) {
        return next(new HttpError('Could not find a destination for the provided id.', 404));
    }
    return res.status(200).json({
        result: destination.toObject({ getters: true })
    });
};


const getDestinationsByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let userDestinations;

    try {
        userDestinations = await User.findById(userId).populate('destinations');
    } catch (error) {
        return next(
            new HttpError('Could not find any destinations for the provided id', 404)
        );
    }
    if (!userDestinations || userDestinations.length === 0) {
        return next(
            new HttpError('Could not find a destination for the provided user id.', 404)
        );
    }
    return res.status(200).json({
        result: userDestinations.destinations.map(destination => destination.toObject({ getters: true }))
    });
};


const createDestination = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(HttpError('Invalid inputs were passed, please check your input data', 422));
    }

    let coordinates;
    let createdDestination;
    let user;
    const { title, description, address } = req.body;

    try {
        coordinates = await getCoordsForAddress(address);

    } catch (error) {
        return next(error);
    };

    createdDestination = new Destination({
        title,
        description,
        address,
        location: coordinates,
        image: req.file.path,
        creator: req.userData.userId
    });

    try {
        user = await User.findById(req.userData.userId);
    } catch (error) {
        return next(error);
    }

    try {
        // rollback scenario for monogoose
        const session = await mongoose.startSession();
        session.startTransaction();
        await createdDestination.save({ sessions: session });
        await user.destinations.push(createdDestination);
        await user.save({ session: session });
        await session.commitTransaction();

    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }

    return res.status(201).json({
        destination: createdDestination
    });

};


const updateDestination = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs were passed, please check your input data', 422));
    }
    const { title, description } = req.body;
    const destinationId = req.params.did;

    let destination;

    try {
        destination = await Destination.findById(destinationId);
    } catch (error) {
        return next(new HttpError(error.message, error.code));
    }

    if (!destination) {
        return next(new HttpError('Could not find a destination for that id.', 404));
    }

    if (destination.creator.toString() !== req.userData.userId) {
        return next(new HttpError('You are not allowed to edit this destination', 401));
    }

    destination.title = title;
    destination.description = description;

    await destination.save();

    return res.status(200).json({
        destination: destination.toObject({ getters: true })
    });
};


const deleteDestination = async (req, res, next) => {
    const destinationId = req.params.did;
    let destination;

    try {
        destination = await Destination.findById(destinationId).populate('creator');
    } catch (error) {
        return next(error);
    }

    if (!destination) {
        return next(new HttpError('Could not find destination for this id', 404))
    }

    if (destination.creator.id !== req.userData.userId) {
        return next(new HttpError('You are not allowed to delete this item', 401));
    }

    const imagePath = destination.image;

    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        await destination.remove({ session: session });
        await destination.creator.destinations.pull(destination);
        await destination.creator.save({ session: session });
        await session.commitTransaction();
    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }
    fs.unlink(imagePath, err => {
        console.log(err);
    });

    return res.status(200).json({
        message: 'Destination was deleted',
        result: destination
    });
};



exports.getDestinationById = getDestinationById;
exports.getDestinationsByUserId = getDestinationsByUserId;
exports.createDestination = createDestination;
exports.updateDestination = updateDestination;
exports.deleteDestination = deleteDestination;