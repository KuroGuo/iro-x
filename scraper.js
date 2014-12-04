'use strict';

var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var url = require('url');

var pages = (function (count) {
  var arr = [];
  var i;
  for (i = 0; i < count; i++) {
    arr.push(i);
  }
  return arr;
})(10);

async.eachSeries(pages, function (pageNum, next) {
  request('http://m.cnbeta.com/list_latest_' + pageNum +'.htm', onListComplete);
  next();
});

function onListComplete(err, res, body) {
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
          next(err);
          return;
        }
        var thumbSrc = $(body).find('img').first().attr('src');
        console.log(a.title, thumbSrc, body.length);
        next();
      });
    }, function (err) {
      if (err) {
        console.error(err);
      }
    });
  }
