'use strict';

var express = require('express');

var user = require('./controllers/user.js');
var music = require('./controllers/music.js');

var router = express.Router();

router.get('/music', music.all);

router.post('/checkOnline', user.checkOnline);
router.post('/register', user.register);
router.post('/login', user.login);

module.exports = router;