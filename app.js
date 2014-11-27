'use strict';

var config = require('./config');

var express = require('express');
var session = require('express-session');
var compression = require('compression');
var bodyParser = require('body-parser');
var errorhandler = require('./middlewares/errorhandler');
var mongoose = require('mongoose');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var webRouter = require('./web_router');
var setupsocket = require('./setupsocket');
var MongoStore = require('connect-mongo')(session);
var view = require('./middlewares/view');

mongoose.connection.on('error', function (err) {
  console.error(err)
});
mongoose.connection.once('open', function () {
  console.log('Open mongoDB success!');
});

mongoose.connect(config.db);

app.use(compression());

app.use('/static', express.static(__dirname + '/static'));

app.use('/api', bodyParser.urlencoded({ extended: false }));
app.use('/api', bodyParser.json());
app.use('/api', bodyParser.json({ type: 'application/vnd.api+json' }));

app.use('/api', session({
  secret: 'kuroguo',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ db: mongoose.connection.db })
}));

// app.use(function (req, res, next) {
//     setTimeout(function () {
//         next();
//     }, 3000);
// });

app.use('/api', webRouter);

app.use(view);

app.use(errorhandler);

setupsocket(io);

server.listen(config.port, function () {
  console.log('Listenning port ' + config.port + '.');
});
