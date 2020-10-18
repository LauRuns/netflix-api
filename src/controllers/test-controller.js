const express = require('express');
const router = express.Router();


const HttpError = require('../models/http-error');


const getTestResults = async (req, res, next) => {
    try {
        return res.status(200).json({
            message: 'Test results OK : status 200'
        });
    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }
};

exports.getTestResults = getTestResults;
