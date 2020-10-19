const axios = require('axios');

let headersConfig = {
    'x-rapidapi-host': 'unogsng.p.rapidapi.com',
    'x-rapidapi-key': process.env.MOVIES_KEY,
    useQueryString: true,
}

class HttpRequest {
    constructor(method = 'get', urlEndpoint, searchParams = null) {
        this.method = method;
        this.urlEndpoint = urlEndpoint;
        this.searchParams = searchParams;
    }

    async sendRequest() {
        const response = await axios({
            method: this.method,
            url: `https://unogsng.p.rapidapi.com/${this.urlEndpoint}`,
            headers: headersConfig,
            params: this.searchParams
        });

        return response;
    }

}

module.exports = HttpRequest;