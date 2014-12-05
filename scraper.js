'use strict';

var config = require('./config');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var url = require('url');
var news = require('./services/news');

var count = 10;

var pages = (function (count) {
  var arr = [];
  var i;
  for (i = count; i >= 1; i--) {
    arr.push(i);
  }
  return arr;
})(count);

module.exports = function (callback) {
  async.eachSeries(pages, function (pageNum, next) {
    request('http://m.cnbeta.com/list_latest_' + pageNum +'.htm', function (err, res, body) {
      if (err) {
        return next(err);
      }
      processList(body, function (err) {
        next(err);
      });
    });
  }, callback);
};

function processList(body, callback) {
  var $ = cheerio.load(body, {
    decodeEntities: false
  });
  var list = $('.module_list li a').toArray().map(function (a) {
    var $a = $(a);
    return {
      title: $a.html(),
      href: url.resolve('http://m.cnbeta.com', $a.attr('href'))
    };
  });

  async.eachSeries(list, function (a, next) {
    request(a.href, function (err, res, body) {
      if (err) {
        return next(err);
      }
      var thumbSrc = $(body).find('img').first().attr('src');
      var content = $(body).find('.articleCont').html();
      news.addOrUpdateOne(a.title, content, 'cnbeta', a.href, function (err) {
        next(err);
      });
    });
  }, callback);
}