'use strict';

var fs = require('fs');
var path = require('path');

exports.all = function (req, res, next) {
    fs.readdir(path.join(__dirname, '../static/music'), function (err, files) {
        if (err) {
            return next(err);
        }

        var musicList = files.filter(function (file) {
            return /\.mp3$/.test(file);
        }).map(function (file) {
            return {
                name: path.basename(file, '.mp3'),
                path: '/static/music/' + file
            };
        });

        res.send(musicList);
    });
};