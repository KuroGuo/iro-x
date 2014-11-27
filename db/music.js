'use strict';

var mongoose = require('mongoose');

var musicSchema = mongoose.Schema({
  name: String,
  src: String,
  lrcUrl: String,
  bgSrc: String
});

module.exports = mongoose.model('Music', musicSchema);