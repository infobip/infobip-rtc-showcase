const https = require('https');

module.exports = function () {
    return {
        post: post
    };
};

async function post(host, path, body, auth) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: 443,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body.length,
                'Authorization': auth
            }
        };

        const req = https.request(options, (res) => {
            let response = [];
            res.on('data', (data) => {
                response.push(data);
            });
            res.on('end', () => {
                resolve(response.join(''));
            });
        });

        req.on('error', (error) => {
            console.error(error);
            reject(error);
        });

        req.write(body);
        req.end();
    });
}
