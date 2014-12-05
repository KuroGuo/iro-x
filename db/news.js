'use strict';

var mongoose = require('mongoose');

var newsSchema = mongoose.Schema({
  title: String,
  content: String,
  from: String,
  fromURL: String,
  updateTime: Date
});

module.exports = mongoose.model('News', newsSchema);