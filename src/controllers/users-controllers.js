const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcyrpt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const JWT_KEY = process.env.JWT_KEY;

const getUsers = async (req, res, next) => {
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

const signup = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs were passed, please check your input data', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return next(new HttpError('Could not create user, email already exists.', 422));
        }
    } catch (error) {
        return next(new HttpError('Could not create user', 500));
    }



    let hashedPassword;
    try {
        hashedPassword = await bcyrpt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Could not create user', 500));
    }

    let newUser;
    let createdUser;

    try {
        if (req.file) {
            createdUser = new User({
                name,
                email,
                image: req.file.path,
                password: hashedPassword,
                places: []
            });
        }
        if (!req.file) {
            createdUser = new User({
                name,
                email,
                password: hashedPassword,
                places: []
            });
        }

        newUser = await createdUser.save();


    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }

    let token;
    try {
        token = jwt.sign({
            email: createdUser.email,
            userId: createdUser.id
        }, JWT_KEY, {
            expiresIn: '1h'
        });

    } catch (error) {
        return next(
            new HttpError(`An error occurred: ${error.message}`, 500)
        );
    }

    return res.status(201).json({
        userId: createdUser.id,
        email: createdUser.email,
        token: token
    });

};


const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs were passed, please check your input data', 422));
    }

    const { email, password } = req.body;
    let existingUser;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    };

    if (!existingUser) {
        return next(
            new HttpError('Invalid credentials, unable to login', 401)
        );
    };

    let isValidPassword = false;
    try {
        isValidPassword = await bcyrpt.compare(password, existingUser.password)
    } catch (error) {
        return next(
            new HttpError('Could not log in - check inputs', 500)
        );
    };

    if (!isValidPassword) {
        return next(
            new HttpError('Could not log in, invalid credentials - check inputs', 500)
        );
    };

    let token;
    try {
        token = jwt.sign({
            email: existingUser.email,
            userId: existingUser._id
        }, JWT_KEY, {
            expiresIn: '1h'
        });

    } catch (error) {
        return next(
            new HttpError(`An error occurred: ${error.message}`, 500)
        );
    }

    return res.status(201).json({
        userId: existingUser._id,
        email: existingUser.email,
        token: token
    });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;


