'use strict';

var News = require('../db/news');

exports.addOrUpdateOne = function (title, content, from, fromURL, callback) {
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
      news.update({
        title: title,
        content: content,
        updateTime: new Date()
      }, callback);
      return;
    }

    // 不存此文档，则新增
    news = new News({
      title: title,
      content: content,
      from: from,
      fromURL: fromURL,
      updateTime: new Date()
    });

    news.save(callback);
  });
};