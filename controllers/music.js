'use strict';

var config = require('../config');
var music = require('../services/music');
var url = require('url');

exports.all = function (req, res, next) {
  music.findAll(function (err, musicList) {
    if (err) {
      next(err);
      return;
    }

    if (config.musicPathPre) {
      musicList = musicList.map(function (music) {
        return {
          name: music.name,
          src: url.resolve(config.musicPathPre, music.src),
          lrcUrl: music.lrcUrl ? url.resolve(config.musicPathPre, music.lrcUrl) : undefined,
          bgSrc: music.bgSrc ? url.resolve(config.musicPathPre, music.bgSrc) : undefined
        };
      });
    }

    res.send(musicList);
  });
};

// exports.all = function (req, res, next) {
//     var musicDir = 'static/music/';
//     fs.readdir(url.resolve(__dirname, '../' + musicDir), function (err, files) {
//         if (err) {
//             return next(err);
//         }

//         var musicList = files.filter(function (file) {
//             return /\.mp3$/.test(file);
//         }).map(function (mp3File) {
//             var regexp_mp3ext = /\.mp3$/;
//             var lrcFile = mp3File.replace(regexp_mp3ext, '.lrc');
//             var bgFile = mp3File.replace(regexp_mp3ext, '.jpg');

//             var src = '/' + musicDir + mp3File;
//             var lrcUrl = '/' + musicDir + lrcFile;
//             var bgSrc = '/' + musicDir + bgFile;

//             var existLrc = files.some(function (file) {
//                 return file === lrcFile;
//             });
//             var existBg = files.some(function (file) {
//                 return file === bgFile;
//             });
      
//             return {
//                 name: path.basename(mp3File, '.mp3'),
//                 src: src,
//                 lrcUrl: existLrc ? lrcUrl : null,
//                 bgSrc: existBg ? bgSrc : null
//             };
//         });

//         res.send(musicList);
//     });
// };