const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true
		},
		email: {
			type: String,
			required: true,
			unique: true
		},
		password: {
			type: String,
			required: true,
			minLength: 6,
			maxLength: 20
		},
		image: {
			type: String
		},
		country: {
			type: String
		},
		destinations: [
			{
				type: mongoose.Types.ObjectId,
				required: true,
				ref: 'Destination'
			}
		]
	},
	{
		timestamps: true
	}
);

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
