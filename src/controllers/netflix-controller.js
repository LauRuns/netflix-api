const express = require('express');
const router = express.Router();
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
	useQueryString: true
};

const getNetflixItems = async (req, res, next) => {
	try {
		// excluding the -password with 'projection'
		const users = await User.find({}, '-password');

		if (!users) {
			return new HttpError('Could not fetch users', 422);
		}

		return res.status(200).json({
			results: users.map((user) => user.toObject({ getters: true }))
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
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

		responseData.forEach((element) => {
			const newEl = {
				country: element.country.trim(),
				countryId: element.id
			};
			countryList.push(newEl);
		});

		return res.status(200).json({
			count: countryList.length,
			results: countryList
		});
	} catch (error) {
		return next(
			new HttpError(
				'Due to an server error, no data could be loaded: ' + error.message,
				error.code
			)
		);
	}
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
			start_year: start_year || 1980,
			orderby: orderby || 'date',
			audiosubtitle_andor: audiosubtitle_andor || null,
			start_rating: start_rating || null,
			limit: limit || 50,
			end_rating: end_rating || null,
			subtitle: subtitle || null,
			countrylist: countrylist || null,
			query: query || null,
			audio: audio || null,
			country_andorunique: country_andorunique || null,
			offset: offset || 0,
			end_year: end_year || 2020
		};

		console.log(searchParams);

		const response = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/search`,
			headers: headersConfig,
			params: searchParams
		});

		console.log('SEARCH DATA_______:', response.data);

		if (response.data.total === 0) {
			console.log('_____COULD NOT FIND ANY DATA____::');
			return next(
				new HttpError('Could not find any data matching your search query', 422)
			);
		}

		if (!response.data.results) {
			return next(
				new HttpError('Could not find any data matching your search query', 422)
			);
		}

		const { count, results } = response.data;

		return res.status(200).json({
			count: count,
			results: results
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

const searchNetflixDBForActor = async (req, res, next) => {
	try {
		const { netflixid, offset, name, limit } = req.body;

		let searchParams = {
			netflifxid: netflixid || null,
			offset: offset || 0,
			name: name,
			limit: limit || 20
		};

		const response = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/people`,
			headers: headersConfig,
			params: searchParams
		});

		if (!response.data.results) {
			return next(
				new HttpError(
					'Could not find any data matching your search queries',
					422
				)
			);
		}

		const dataCount = response.data.results.length;
		let responseData = response.data.results;

		return res.status(200).json({
			count: dataCount,
			results: responseData
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

const searchNetflixDBForDeletedItems = async (req, res, next) => {
	try {
		const { limit, netflixid, countrylist, offset, date } = req.body;

		let searchParams = {
			limit: limit || 20,
			netflifxid: netflixid || null,
			countrylist: countrylist || null,
			offset: offset || 0,
			date: date
		};

		const response = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/titlesdel`,
			headers: headersConfig,
			params: searchParams
		});

		if (!response.data.results) {
			return next(
				new HttpError(
					'Could not find any data matching your search queries',
					422
				)
			);
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
		return next(new HttpError(error.message, error.code));
	}
};

// Get all countries associated with a particular Netflix ID
const getCountriesForID = async (req, res, next) => {
	try {
		const { netflixid } = req.body;

		let searchParam = {
			netflixid: netflixid
		};

		const response = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/titlecountries`,
			headers: headersConfig,
			params: searchParam
		});

		if (!response.data.results) {
			return next(
				new HttpError(
					'Could not find any data matching your search querie',
					422
				)
			);
		}

		const dataCount = response.data.results.length;
		let responseData = response.data.results;

		const countries = responseData.map(({ country }) => country);

		return res.status(200).json({
			count: dataCount,
			results: countries
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

// Specific information for a given Netflix title using ID as search param
const getInfoForID = async (req, res, next) => {
	try {
		const { netflixid, imdbid } = req.body;

		let searchParam = {
			netflixid: netflixid || null,
			imdbid: imdbid || null
		};

		const response = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/title`,
			headers: headersConfig,
			params: searchParam
		});

		if (response.data.results.length === 0) {
			return next(
				new HttpError('Could not find any data matching your search query', 422)
			);
		}

		const dataCount = response.data.results.length;
		let responseData = response.data.results[0];

		return res.status(200).json({
			count: dataCount,
			results: responseData
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

const getExpiring = async (req, res, next) => {
	try {
		const { countryId, offset, limit } = req.body;

		let searchParams = {
			countrylist: countryId,
			offset: offset || null,
			limit: limit || 20
		};

		const response = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/expiring`,
			headers: headersConfig,
			params: searchParams
		});

		if (!response.data.results) {
			return next(
				new HttpError(
					'Could not find any data matching your search querie',
					422
				)
			);
		}

		const {
			data: { total, results }
		} = response;

		return res.status(200).json({
			count: total,
			results: results
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

const getHomePageDetails = async (id) => {
	try {
		let searchParamID = {
			netflixid: id
		};

		const response = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/title`,
			headers: headersConfig,
			params: searchParamID
		});

		if (response.data.results.length === 0) {
			return next(
				new HttpError('Could not find any data matching your search query', 422)
			);
		}
		const {
			data: { results }
		} = response;
		return results;
	} catch (error) {
		console.log(error);
	}
};

const getDataForId = async (dataList) => {
	try {
		const reqdata = await dataList.map((idd) => {
			return axios({
				method: 'get',
				url: `https://unogsng.p.rapidapi.com/title`,
				headers: headersConfig,
				params: {
					netflixid: idd
				}
			});
		});

		const data = await axios.all([...reqdata]);
		return data;
	} catch (error) {
		throw error;
	}
};

const mapCountryResultData = async (data) => {
	return await data.map((item) => item.data.results[0]);
};

// should be multiple calls to the db
const fetchLandingPageData = async (req, res, next) => {
	try {
		const { countryId, offset, limit } = req.body;

		let id = `${countryId.toString()}, 67`;
		console.log('ID_____::', id);

		let searchParamsExp = {
			countrylist: id,
			offset: offset || 0,
			limit: limit || 10
		};

		let searchParamsNL = {
			newdate: new Date('2015-01-01'),
			start_year: 2017,
			orderby: 'date',
			limit: limit || 4,
			countrylist: '67',
			audio: 'english',
			offset: offset || 0,
			end_year: 2020
		};

		let searchParamsOther = {
			newdate: new Date('2015-01-01'),
			start_year: 2017,
			orderby: 'date',
			limit: limit || 4,
			countrylist: countryId,
			audio: 'english',
			offset: offset || 0,
			end_year: 2020
		};
		const source = axios.CancelToken.source();

		const resData = await axios.all([
			axios({
				method: 'get',
				url: `https://unogsng.p.rapidapi.com/expiring`,
				headers: headersConfig,
				params: searchParamsExp,
				cancelToken: source.token
			}),
			axios({
				method: 'get',
				url: `https://unogsng.p.rapidapi.com/search`,
				headers: headersConfig,
				params: searchParamsNL,
				cancelToken: source.token
			}),
			axios({
				method: 'get',
				url: `https://unogsng.p.rapidapi.com/search`,
				headers: headersConfig,
				params: searchParamsOther,
				cancelToken: source.token
			})
		]);

		let response = resData[0].data.results;
		let responseSearchNL = resData[1].data.results;
		let responseSearchOther = resData[2].data.results;

		const nldResults = response.filter(({ countrycode }) => {
			if (countrycode === 'NL') {
				return countrycode;
			}
		});

		const otherResults = response.filter(({ countrycode }) => {
			if (countrycode !== 'NL') {
				return countrycode;
			}
		});

		const nlIDs = nldResults.map(({ netflixid }) => netflixid);
		const otherIDs = otherResults.map(({ netflixid }) => netflixid);

		const getNLdata = await getDataForId(nlIDs);
		const getOTHERdata = await getDataForId(otherIDs);

		const mappedNLdata = await mapCountryResultData(getNLdata);
		const mappedOTHERdata = await mapCountryResultData(getOTHERdata);

		return res.status(200).json({
			newResultsNL: responseSearchNL,
			newResultsOther: responseSearchOther,
			resultsNLD: mappedNLdata,
			resultsOTHER: mappedOTHERdata
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

const fetchNetflixDataForCountry = async (req, res, next) => {
	try {
		const { countryId, offset, limit } = req.body;

		let searchParamsExp = {
			countrylist: countryId,
			offset: offset || 0,
			limit: limit || 20
		};

		let searchParamsNew = {
			newdate: new Date('2015-01-01'),
			start_year: 2017,
			orderby: 'date',
			limit: limit || 20,
			countrylist: countryId,
			audio: 'english',
			offset: offset || 0,
			end_year: 2020
		};

		const response = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/expiring`,
			headers: headersConfig,
			params: searchParamsExp
		});

		const responseSearchNew = await axios({
			method: 'get',
			url: `https://unogsng.p.rapidapi.com/search`,
			headers: headersConfig,
			params: searchParamsNew
		});

		if (!response.data.results || !responseSearchNew.data.results) {
			return next(
				new HttpError('Could not find any data matching your search query', 422)
			);
		}

		const newItems = responseSearchNew.data.results;

		const {
			data: { results, total }
		} = response;

		const expIDs = results.map(({ netflixid }) => netflixid);
		const getEXPdata = await getDataForId(expIDs);
		const mappedEXPdata = await mapCountryResultData(getEXPdata);

		return res.status(200).json({
			expResults: mappedEXPdata,
			newResults: newItems
		});
	} catch (error) {
		return next(new HttpError(error.message, error.code));
	}
};

exports.getNetflixItems = getNetflixItems;
exports.getNetflixCountries = getNetflixCountries;
exports.searchNetflixDB = searchNetflixDB;
exports.searchNetflixDBForActor = searchNetflixDBForActor;
exports.searchNetflixDBForDeletedItems = searchNetflixDBForDeletedItems;
exports.getCountriesForID = getCountriesForID;
exports.getInfoForID = getInfoForID;
exports.getExpiring = getExpiring;
exports.fetchLandingPageData = fetchLandingPageData;

exports.fetchNetflixDataForCountry = fetchNetflixDataForCountry;
