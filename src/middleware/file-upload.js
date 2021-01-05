const multer = require('multer');

const MIME_TYPE_MAP = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg'
};

const fileUpload = multer({
	limit: 500000,
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			const isValid = MIME_TYPE_MAP[file.mimetype];
			let error = new Error('Invalid mime type');
			if (isValid) {
				error = null;
			}
			cb(error, 'src/uploads/images');
		},
		filename: (req, file, cb) => {
			const ext = MIME_TYPE_MAP[file.mimetype];
			const fileName = file.originalname
				.toLocaleLowerCase()
				.split(' ')
				.join('-')
				.split('.' + ext)
				.join('-');
			cb(null, `${fileName + Date.now()}.${ext}`);
		}
	}),
	fileFilter: (req, file, cb) => {
		const isValid = !!MIME_TYPE_MAP[file.mimetype];
		let error = isValid ? null : new Error('Invalid mime type!');
		cb(error, isValid);
	}
});

module.exports = fileUpload;
