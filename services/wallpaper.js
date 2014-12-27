'use strict';

var Wallpaper = require('../db/wallpaper');

exports.findAll = function (callback) {
  Wallpaper.find().sort({_id: -1}).exec(callback);
};