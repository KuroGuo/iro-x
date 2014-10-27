'use strict';

var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    name: String,
    pwdmd5: String
});

module.exports = mongoose.model('User', userSchema);