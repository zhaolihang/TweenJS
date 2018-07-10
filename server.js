let httpServer = require('http-server');
let shelljs = require('shelljs');
let path = require('path');

shelljs.cd(__dirname);

let server = httpServer.createServer({
    cache: 0,
    logFn: (req, res, err) => {
        if (err) {
            console.error(err);
            console.error(req.method, req.url);
        } else {
            console.log(req.method, req.url);
        }
    },
    before: [(req, res) => {
        res.emit('next');
    }],
});

server.listen(8888);
console.log(8888);