'use strict';

var Music = require('../db/music');

exports.findAll = function (callback) {
    Music.find(callback);
};