'use strict';

var config = require('../config');
var wallpaper = require('../services/wallpaper');
var url = require('url');

exports.all = function (req, res, next) {
  wallpaper.findAll(function (err, wallpapers) {
    if (err) {
      next(err);
      return;
    }

    if (config.wallpaperPathPre) {
      wallpapers = wallpapers.map(function (wallpaper) {
        return {
          name: wallpaper.name,
          src: url.resolve(config.wallpaperPathPre, wallpaper.src)
        };
      });
    }

    res.send(wallpapers);
  });
};