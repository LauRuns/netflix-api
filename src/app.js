const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const HttpError = require('./models/http-error');


// Route references

const testRoutes = require('./routes/test-routes');


const app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());

// Returns static files - requested images
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// Handle CORS - prior to passing it to the routes
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') {
        res.header(
            'Access-Control-Allow-Methods',
            'GET, POST, PATCH, PUT, DELETE, OPTIONS'
        );
    }
    next();
});


// Routes to handle requests
app.use('/api/test', testRoutes);


// Middleware for unsupported routes
app.use((req, res, next) => {
    next(new HttpError('Unsupported route', 404));
});


// General Error handling
app.use((error, req, res, next) => {

    // Remove file if a validation error occurrs during sign-up
    if (req.file) {
        fs.unlink(req.file.path, err => {
            console.log('File deletion:', err);
        });
    }

    if (res.headerSent) {
        return next(error);
    }

    res.status(error.code || 500).json({
        message: error.message || 'An unexpected error occurred'
    });

});



module.exports = app;
