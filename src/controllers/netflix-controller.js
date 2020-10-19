const multer = require('multer');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../utils/location');
const Destination = require('../models/destination');
const User = require('../models/user');


const getNetflixItems = async (req, res, next) => {
    try {
        // exclusing the -password with 'projection'
        const users = await User.find({}, '-password');

        if (!users) {
            return new HttpError('Could not fetch users', 422);
        }

        return res.status(200).json({
            results: users.map(user => user.toObject({ getters: true }))
        })
    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }
};

exports.getNetflixItems = getNetflixItems;