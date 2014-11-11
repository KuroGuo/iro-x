// 默认配置

var config = {
    db: 'mongodb://localhost/iro',
    port: process.env.PORT || 1337,
    musicPathPre: '/static/'
};

module.exports = config;
