const multer = require('multer');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fs = require('fs');

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const HttpError = require('../models/http-error');
const HttpRequest = require('../models/http-request');
const getCoordsForAddress = require('../utils/location');
const Destination = require('../models/destination');
const User = require('../models/user');


let headersConfig = {
    'x-rapidapi-host': 'unogsng.p.rapidapi.com',
    'x-rapidapi-key': process.env.MOVIES_KEY,
    useQueryString: true,
}


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


const getNetflixCountries = async (req, res, next) => {
    try {
        // const response = await axios({
        //     method: 'get',
        //     url: `https://unogsng.p.rapidapi.com/countries`,
        //     headers: headersConfig
        // });

        const getData = new HttpRequest('get', 'countries', null);
        const response = await getData.sendRequest();

        const responseData = response.data.results;
        let countryList = [];

        if (!responseData || responseData.length < 1) {
            return next(new HttpError('Could not find movie data', 422));
        }

        responseData.forEach(element => {
            const newEl = {
                country: element.country.trim(),
                countryId: element.id
            }
            countryList.push(newEl);
        });

        return res.status(200).json({
            count: countryList.length,
            results: countryList
        })

    } catch (error) {
        return next(
            new HttpError('Due to an server error, no data could be loaded: ' + error.message, error.code)
        );
    };
};


const searchNetflixDB = async (req, res, next) => {
    try {

        const {
            newdate,
            genrelist,
            type,
            start_year,
            orderby,
            audiosubtitle_andor,
            start_rating,
            limit,
            end_rating,
            subtitle,
            countrylist,
            query,
            audio,
            country_andorunique,
            offset,
            end_year
        } = req.body;

        let searchParams = {
            newdate: newdate || null,
            genrelist: genrelist || null,
            type: type || null,
            start_year: start_year || 2001,
            orderby: orderby || 'date',
            audiosubtitle_andor: audiosubtitle_andor || 'and',
            start_rating: start_rating || null,
            limit: limit || 20,
            end_rating: end_rating || null,
            subtitle: subtitle || 'english',
            countrylist: countrylist || null,
            query: query || null,
            audio: audio || 'english',
            country_andorunique: country_andorunique || 'unique',
            offset: offset || 0,
            end_year: end_year || 2020
        }


        const response = await axios({
            method: 'get',
            url: `https://unogsng.p.rapidapi.com/search`,
            headers: headersConfig,
            params: searchParams
        });

        if (!response.data.results) {
            return next(new HttpError('Could not find any data matching your search queries', 422));
        }

        const dataCount = response.data.results.length;
        let responseData = response.data.results;

        return res.status(200).json({
            count: dataCount,
            results: responseData
        });

    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }
}

const searchNetflixDBForActor = async (req, res, next) => {
    try {
        const {
            netflixid,
            offset,
            name,
            limit
        } = req.body;

        let searchParams = {
            netflifxid: netflixid || null,
            offset: offset || 0,
            name: name,
            limit: limit || 20
        }

        const response = await axios({
            method: 'get',
            url: `https://unogsng.p.rapidapi.com/people`,
            headers: headersConfig,
            params: searchParams
        });

        if (!response.data.results) {
            return next(new HttpError('Could not find any data matching your search queries', 422));
        }

        const dataCount = response.data.results.length;
        let responseData = response.data.results;

        return res.status(200).json({
            count: dataCount,
            results: responseData
        });

    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }
}

const searchNetflixDBForDeletedItems = async (req, res, next) => {
    try {
        const {
            limit,
            netflixid,
            countrylist,
            offset,
            date
        } = req.body;

        let searchParams = {
            limit: limit || 20,
            netflifxid: netflixid || null,
            countrylist: countrylist || null,
            offset: offset || 0,
            date: date,
        }

        const response = await axios({
            method: 'get',
            url: `https://unogsng.p.rapidapi.com/titlesdel`,
            headers: headersConfig,
            params: searchParams
        });

        console.log(searchParams);

        if (!response.data.results) {
            return next(new HttpError('Could not find any data matching your search queries', 422));
        }

        const dataCount = response.data.results.length;
        let responseData = response.data.results;

        console.log(response.data);


        return res.status(200).json({
            count: dataCount,
            totalItemsDeleted: response.data.total,
            results: responseData
        });

    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }
}

// Get all countries associated with a particular Netflix ID
const getCountriesForID = async (req, res, next) => {
    try {
        const { netflixid } = req.body;

        let searchParam = {
            netflixid: netflixid
        }

        const response = await axios({
            method: 'get',
            url: `https://unogsng.p.rapidapi.com/title`,
            headers: headersConfig,
            params: searchParam
        });

        console.log(searchParam);

        if (!response.data.results) {
            return next(new HttpError('Could not find any data matching your search querie', 422));
        }

        const dataCount = response.data.results.length;
        let responseData = response.data.results;

        console.log(response.data);

        return res.status(200).json({
            count: dataCount,
            totalItemsDeleted: response.data.total,
            results: responseData
        });

    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }
}

const getExpiring = async (req, res, next) => {
    try {

        const {
            countrylist,
            offset,
            limit
        } = req.body;

        let searchParams = {
            countrylist: countrylist,
            offset: offset || null,
            limit: limit || null
        }


        const response = await axios({
            method: 'get',
            url: `https://unogsng.p.rapidapi.com/expiring`,
            headers: headersConfig,
            params: searchParams
        });

        console.log(searchParams);

        if (!response.data.results) {
            return next(new HttpError('Could not find any data matching your search querie', 422));
        }

        const dataCount = response.data.results.length;
        let responseData = response.data.results;

        return res.status(200).json({
            count: dataCount,
            totalItemsExpiring: response.data.total,
            results: responseData
        });


    } catch (error) {
        return next(
            new HttpError(error.message, error.code)
        );
    }
}



exports.getNetflixItems = getNetflixItems;
exports.getNetflixCountries = getNetflixCountries;
exports.searchNetflixDB = searchNetflixDB;
exports.searchNetflixDBForActor = searchNetflixDBForActor;
exports.searchNetflixDBForDeletedItems = searchNetflixDBForDeletedItems;
exports.getCountriesForID = getCountriesForID;
exports.getExpiring = getExpiring;