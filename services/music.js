'use strict';

var Music = require('../db/music');

var musicPathPre = 'http://kuro-iro.b0.upaiyun.com';

exports.findAll = function (callback) {
    Music.find(function (err, musicList) {
        if (err) {
            callback.call(this, err, null);
            return;
        }

        musicList = musicList.map(function (music) {
            return {
                name: music.name,
                src: musicPathPre + music.src,
                lrcUrl: music.lrcUrl ? musicPathPre + music.lrcUrl : undefined,
                bgSrc: music.bgSrc ? musicPathPre + music.bgSrc : undefined
            };
        });
        
        callback.call(this, null, musicList);
    });
};