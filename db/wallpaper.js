'use strict';

var mongoose = require('mongoose');

var wallpaperSchema = mongoose.Schema({
  name: String,
  src: String
});

module.exports = mongoose.model('Wallpaper', wallpaperSchema);