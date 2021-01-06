const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const netflixItemSchema = new Schema({
	nfid: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	synopsis: {
		type: String,
		required: true
	},
	year: {
		type: String,
		required: true
	},
	imdbrating: {
		type: String,
		required: true
	},
	img: {
		type: String,
		required: true
	},
	creator: {
		type: mongoose.Types.ObjectId,
		required: true,
		ref: 'User'
	}
});

module.exports = mongoose.model('NetflixItem', netflixItemSchema);
