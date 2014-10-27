'use strict';

var express = require('express');

var user = require('./controllers/user.js');

var router = express.Router();

router.post('/checkOnline', user.checkOnline);
router.post('/register', user.register);
router.post('/login', user.login);

module.exports = router;