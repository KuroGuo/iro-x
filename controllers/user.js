'use strict';

var user = require('../services/user.js');

exports.checkOnline = function (req, res, next) {
    res.send({user: req.session.user || null});
};

exports.register = function (req, res, next) {
    var username = req.body.username,
        password = req.body.password;

    user.add(username, password, function (err) {
        if (err) {
            return next(err);
        }
        res.send('register ok!');
    });
};

exports.login = function (req, res, next) {
    var username = req.body.username,
        password = req.body.password;

    user.getByUsernameAndPassword(username, password, function (err, user) {
        var isok = false,
            message = '口令无效';

        if (err) {
            return next(err);
        }
        if (user) {
            req.session.user = {
                name: user.name
            };
            isok = true;
            message = '登录成功';
        }
        res.send({isok: isok, user: req.session.user, message: message});
    });
};