'use strict';

var config = require('./config');
var mongoose = require('mongoose');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var url = require('url');
var news = require('./services/news');

var count = 3;

var pages = (function (count) {
  var arr = [];
  var i;
  for (i = count; i >= 1; i--) {
    arr.push(i);
  }
  return arr;
})(count);

mongoose.connect(config.db);

async.parallel([
  function (callback) {
    async.each(pages, function (pageNum, next) {
      request('http://m.cnbeta.com/list_latest_' + pageNum +'.htm', function (err, res, body) {
        if (err) {
          return next(err);
        }
        processCnbetaList(body, next);
      });
    }, callback);
  },
  function (callback) {
    async.each(pages, function (pageNum, next) {
      request('http://www.acfun.tv/v/list110/index_' + pageNum + '.htm', function (err, res, body) {
        if (err) {
          return next(err);
        }
        processAcfunList(body, next);
      });
    }, callback);
  }
], function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  process.exit(0);
});

function processCnbetaList(body, callback) {
  var $ = cheerio.load(body, {
    decodeEntities: false
  });
  var list = $('.module_list li a').toArray().map(function (a) {
    var $a = $(a);
    return {
      title: $a.html(),
      href: url.resolve('http://m.cnbeta.com', $a.attr('href'))
    };
  }).reverse();

  async.each(list, function (a, next) {
    request(a.href, function (err, res, body) {
      if (err) {
        return next(err);
      }
      var $ = cheerio.load(body, {
        decodeEntities: false
      });
      var $content = $('.articleCont');
      var thumbSrc = $content.find('img').first().attr('src');
      var content = $content.html();
      news.createOrUpdateOne(a.title, content, 'cnbeta', a.href, thumbSrc, next);
    });
  }, callback);
}

function processAcfunList(body, callback) {
  var $ = cheerio.load(body, {
    decodeEntities: false
  });
  var list = $('#block-content-article .item a.title').toArray().map(function (a) {
    var $a = $(a);
    return {
      title: $a.html(),
      href: url.resolve('http://www.acfun.tv', $a.attr('href'))
    };
  }).reverse();

  async.each(list, function (a, next) {
    request(a.href, function (err, res, body) {
      if (err) {
        return next(err);
      }
      var $ = cheerio.load(body, {
        decodeEntities: false
      });
      var $content = $('#area-player');
      var thumbSrc = $content.find('img').first().attr('src');
      var content = $content.html();
      news.createOrUpdateOne(a.title, content, 'acfun', a.href, thumbSrc, next);
    });
  }, callback);
}
