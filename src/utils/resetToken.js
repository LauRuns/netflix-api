const crypto = require('crypto');

/* Generates a reset token which is set in the user object using the crypto method from Nodejs */
const generateResetToken = async () => {
	const buffer = await new Promise((resolve, reject) => {
		crypto.randomBytes(32, function (err, buffer) {
			if (err) {
				reject('error generating token');
				return console.log('Crypto could not be set', err.message);
			}
			resolve(buffer);
		});
	});
	const token = crypto.createHash('sha1').update(buffer).digest('hex');
	return token;
};

exports.generateResetToken = generateResetToken;
