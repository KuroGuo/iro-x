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
  var lastNewsId = req.query.lastNewsId;
  var count = req.query.count || 50;

  news.query(lastNewsId, count, function (err, newsList) {
    if (err) {
      return next(err);
    }
    res.send(newsList);
  });
};