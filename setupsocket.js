'use strict';

var video = require('./services/video');

module.exports = function (io) {
  setupDanmuIO(io);
};

function setupDanmuIO(io) {
  var danmuIO = io.of('/danmu');
  danmuIO.on('connection', function (socket) {
    var roomid,
      vid,
      title;

    socket.on('load', function (data) {
      vid = data.vid,
      title = data.title;
      roomid = vid;

      socket.join(roomid);

      video.findOrCreateOne(vid, title, function (err, video) {
        socket.emit('load', {danmus: video.danmus});
      });
    });

    socket.on('say', function (data) {
      var content = data.content,
        videoTime = data.videoTime;

      if (roomid) {
        socket.broadcast.to(roomid).emit('newDanmu', {_id: new Date().getTime() ,content: content, videoTime: videoTime});
        video.addDanmu(vid, videoTime, content);
      }
    });
  });
}