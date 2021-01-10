const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const app = require('./src/app');
const debug = require('debug')('node-rest-api');
const server = http.createServer(app);
const mongoose = require('mongoose');

const url = process.env.MONGO_DB_URL;

const normalizePort = (val) => {
	let port = parseInt(val, 10);

	if (isNaN(port)) {
		return val;
	}
	if (port >= 0) {
		return port;
	}

	return false;
};

const onError = (error) => {
	if (error.syscall !== 'listen') {
		throw error;
	}
	const bind = typeof port === 'string' ? 'pipe ' + port : 'port ' + port;
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
		default:
			throw error;
	}
};

const onListening = () => {
	const addr = server.address();
	const bind = typeof port === 'string' ? 'pipe ' + port : 'port ' + port;

	debug('Listening on ' + bind);
};

const port = normalizePort(process.env.PORT || 8082);
app.set('port', port);

server.on('error', onError);
server.on('listening', onListening);

/* Connecting to MongoDB */
mongoose
	.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	})
	.then((result) => {
		console.log('Mongo DB connected');

		/* Initiating server */
		server.listen(port, (err) => {
			if (err) {
				console.log(err);
			}
			return console.log(`Server is listening on port ${port}!`);
		});
	})
	.catch((error) => {
		console.log(error);
		process.exit();
	});
