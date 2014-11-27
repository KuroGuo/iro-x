'use strict';

var Video = require('../db/video');

exports.addVideo = function (vid, title, callback) {
  var video = new Video({
    vid: vid,
    title: title
  });

  video.save(callback);
};

exports.addDanmu = function (vid, videoTime, content, callback) {
  Video.update({vid: vid}, {
    $push: {
      danmus: {
        content: content,
        videoTime: videoTime,
        sendTime: new Date()
      }
    }
  }, callback || function () {});
};

exports.findOneByVid = function (vid) {
  return Video.findOne({vid: vid});
};

exports.findOrCreateOne = function (vid, title, callback) {
  Video.findOne({vid: vid}, function (err, video) {
    if (!video) {
      video = new Video({
        vid: vid,
        title: title
      });

      video.save(callback);
      return;
    }

    if (typeof callback === 'function') {
      callback.apply(this, arguments);
    }
  });
};