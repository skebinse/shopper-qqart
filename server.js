const http = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const PORT = 3000;

// middleware.js 가 요청 URL 을 만들 때 hostname · port 가 필요함 (없으면 https://undefined:undefined 로 모든 API 500)
const app = next({ dev, hostname: 'localhost', port: PORT });
const handle = app.getRequestHandler();

app.prepare().then(() => {

    // const http = require("http");
    // const fs = require("fs");
    // const options = {
    // };
    // http
    //     .createServer(options, function (req, res) {
    //         // Be sure to pass `true` as the second argument to `url.parse`.
    //         // This tells it to parse the query portion of the URL.
    //         const parsedUrl = parse(req.url, true);
    //         handle(req, res, parsedUrl);
    //     })
    //     .listen(PORT, (err) => {
    //         if (err) throw err;
    //         console.log(`> Ready on http://localhost:${PORT}`);
    //     });

    const https = require("https");
    const fs = require("fs");
    const options = {
        key: fs.readFileSync('./localhost-key.pem'),
        cert: fs.readFileSync('./localhost.pem'),
    };
    https
        .createServer(options, function (req, res) {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        })
        .listen(PORT, (err) => {
            if (err) throw err;
            console.log(`> Ready on https://localhost:${PORT}`);
        });
});