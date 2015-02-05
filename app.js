'use strict';

var config = require('./config');

var express = require('express');
var session = require('express-session');
var compression = require('compression');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorhandler = require('./middlewares/errorhandler');
var mongoose = require('mongoose');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var webRouter = require('./web_router');
var setupsocket = require('./setupsocket');
var MongoStore = require('connect-mongo')(session);
var view = require('./middlewares/view');
var child_process = require('child_process');

mongoose.connection.on('error', function (err) {
  console.error(err)
});
mongoose.connection.once('open', function () {
  console.log('Open mongoDB success!');
});

mongoose.connect(config.db);

app.use(compression());

app.use('/static', express.static(__dirname + '/static'));

app.use('/api', bodyParser.json());
app.use('/api', bodyParser.urlencoded({ extended: true }));
app.use('/api', multer());

app.use('/api', session({
  secret: config.sessionSecret,
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

// app.use(function (req, res, next) {
//     setTimeout(function () {
//         next();
//     }, 400);
// });

app.use('/api', webRouter);

app.use(view);

app.use(errorhandler);

setupsocket(io);

server.listen(config.port, function () {
  console.log('Listenning port ' + config.port + '.');
});

var scrap_child_process;
setInterval(function () {
  if (scrap_child_process) {
    scrap_child_process.kill();
  }
  scrap_child_process = child_process.fork('scraper.js')
}, config.scrapRate);
