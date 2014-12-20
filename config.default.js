// 默认配置
'use strict';

var config = {
  // mongodb地址
  db: 'mongodb://localhost/iro',

  // 监听端口
  port: process.env.PORT || 1337,

  // 音乐路径前缀
  musicPathPre: '/static/',

  // 壁纸路径前缀
  wallpaperPathPre: '/static/',

  // 爬虫采集间隔时间（单位：毫秒）
  scrapRate: 20 * 60 * 1000
};

module.exports = config;
