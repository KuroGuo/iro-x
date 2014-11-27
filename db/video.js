'use strict';

var mongoose = require('mongoose');

var videoSchema = mongoose.Schema({
  vid: String,
  title: String,
  src: String,
  danmus: [{
    content: String,
    videoTime: Number,
    sendTime: Date
  }],
  comments: [{
    body: String,
    date: Date,
    writer: mongoose.Schema.Types.ObjectId
  }]
});

module.exports = mongoose.model('Video', videoSchema);