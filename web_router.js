'use strict';

var express = require('express');

var music = require('./controllers/music');
var wallpaper = require('./controllers/wallpaper');

var router = express.Router();

router.get('/music', music.all);

router.get('/wallpaper', wallpaper.all);

module.exports = router;