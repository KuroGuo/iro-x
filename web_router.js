'use strict';

var express = require('express');

var music = require('./controllers/music.js');

var router = express.Router();

router.get('/music', music.all);

module.exports = router;