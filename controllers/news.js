'use strict';

var news = require('../services/news');

exports.get = function (req, res, next) {
  var id = req.params.id;

  news.getById(id, function (err, news) {
    if (err) {
      return next(err);
    }
    res.send(news);
  });
};

exports.query = function (req, res, next) {
  var startId = req.query.startId;
  var count = req.query.count || 50;

  news.query(startId, count, function (err, newsList) {
    if (err) {
      return next(err);
    }

    res.send(newsList);
  });
};