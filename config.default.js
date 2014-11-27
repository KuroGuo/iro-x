// 默认配置
'use strict';

var config = {
  db: 'mongodb://localhost/iro',
  port: process.env.PORT || 1337,
  musicPathPre: '/static/',
  wallpaperPathPre: '/static/'
};

module.exports = config;
