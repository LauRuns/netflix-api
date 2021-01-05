const axios = require('axios');

let headersConfig = {
	'x-rapidapi-host': 'unogsng.p.rapidapi.com',
	'x-rapidapi-key': process.env.MOVIES_KEY,
	useQueryString: true
};

// const source = axios.CancelToken.source();

class HttpRequest {
	constructor(method = 'get', urlEndpoint, searchParams = null, cancelToken) {
		this.method = method;
		this.urlEndpoint = urlEndpoint;
		this.searchParams = searchParams;
		this.cancelToken = cancelToken;
	}

	async sendRequest() {
		try {
			const response = await axios({
				method: this.method,
				url: `https://unogsng.p.rapidapi.com/${this.urlEndpoint}`,
				headers: headersConfig,
				params: this.searchParams,
				cancelToken: this.cancelToken
			}).catch((thrown) => {
				if (axios.isCancel(thrown)) {
					console.log(thrown.message);
				} else {
					throw error;
				}
			});

			return response;
		} catch (error) {
			console.log('HTTP REQ ERROR', error);
		}
	}
}

module.exports = HttpRequest;
