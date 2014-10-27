'use strict';

var User = require('../db/user.js'),
    crypto = require('crypto');

exports.add = function (name, password, callback) {
    var user = new User({
        name: name,
        pwdmd5: md5(password)
    });

    user.save(callback);
};

exports.getByUsernameAndPassword = function (username, password, callback) {
    User.findOne({name: username, pwdmd5: md5(password)}, callback);
};

function md5(text) {
    var hash = crypto.createHash('md5');
    hash.update(text + '!ku*ro@#');
    return hash.digest('hex');
}