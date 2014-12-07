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
  var page = req.query.page || 1;
  var pagesize = req.query.pagesize || 50;

  news.query(page, pagesize, function (err, newsList) {
    if (err) {
      return next(err);
    }
    res.send(newsList);
  });
};