'use strict';

var fs = require('fs'),
    path = require('path');

module.exports = function (req, res, next) {
    if (/^\/static\//.test(req.path)) {
        next();
        return;
    }

    fs.readFile(path.join(__dirname, '../static/index.html'), {
        encoding: 'utf8'
    }, function (err, data) {
        if (err) {
            next(err);
        }
        res.send(data);
    });
}