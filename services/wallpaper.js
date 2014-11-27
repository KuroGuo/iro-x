'use strict';

var Wallpaper = require('../db/wallpaper');

exports.findAll = function (callback) {
  Wallpaper.find(callback);
};