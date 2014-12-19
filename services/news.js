'use strict';

var News = require('../db/news');

exports.getById = function (id, callback) {
  News.findById(id, callback);
};

exports.query = function (startId, count, callback) {
  var criteria = startId ? {_id: {$lt: startId}} : null;

  News.find(criteria)
    .sort({_id: 'desc'})
    .limit(count)
    .exec(function (err, newsList) {
      if (err) {
        return callback.call(this, err);
      }
      callback.call(this, null, newsList);
    });
};

exports.createOrUpdateOne = function (title, content, from, fromURL, thumbSrc, callback) {
  News.findOne({fromURL: fromURL}, function (err, news) {
    if (err) {
      return callback.call(this, err);
    }

    if (news) {
      if (news.title === title && news.content === content) {
        // 已存在内容相同文档，则返回
        return callback.call(this);
      }

      // 存在此文档但内容不相同，则更新
      news.title = title;
      news.content = content;
      news.thumbSrc = thumbSrc;
      news.updateTime = new Date();
    } else {
      // 不存此文档，则新增
      news = new News({
        title: title,
        content: content,
        from: from,
        fromURL: fromURL,
        thumbSrc: thumbSrc,
        updateTime: new Date()
      });
    }

    news.save(callback);
  });
};