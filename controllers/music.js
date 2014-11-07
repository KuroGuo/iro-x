'use strict';

var music = require('../db/music.json');

exports.all = function (req, res, next) {
    var musics = music.list.map(function (thisMusic) {
        return {
            name: thisMusic.name,
            src: 'http://' + music.host + thisMusic.src,
            lrcUrl: thisMusic.lrcUrl ? 'http://' + music.host + thisMusic.lrcUrl : undefined,
            bgSrc: thisMusic.bgSrc ? 'http://' + music.host + thisMusic.bgSrc : undefined
        };
    });
    res.send(musics);
};

// exports.all = function (req, res, next) {
//     var musicDir = 'static/music/';
//     fs.readdir(path.join(__dirname, '../' + musicDir), function (err, files) {
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