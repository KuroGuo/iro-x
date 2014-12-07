'use strict';

var express = require('express');

var music = require('./controllers/music');
var wallpaper = require('./controllers/wallpaper');
var news = require('./controllers/news');

var router = express.Router();

router.get('/music', music.all);

router.get('/wallpaper', wallpaper.all);

router.get('/news', news.query);
router.get('/news/:id', news.get);

module.exports = router;