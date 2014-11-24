var r = require('rethinkdb');
var express = require('express');
var socketio = require('socket.io');
var Promise = require('es6-promise').Promise;

var config = require('./config');
var db = require('./ffmap/db');
var logger = require('./util/logger');

var app = express();
app.use(express.static(config.frontend.path));
var io = socketio.listen(app.listen(config.port), { log: false });

db.init(config).then(function () {
    var fetchData = require('./ffmap/aggregator').for(config.backend.type);
    var penality = 1;
    function setup() {
        fetchData(config).then(function () {
            logger.info('Received data and stored to DB');
            penality = 1;
        }, function () {
            penality = penality * 2;
            logger.warn('Problem fetching data or storing in DB');
        });
        setTimeout(function () {
            setup();
        }, config.backend.interval * penality);
    }

    setup();
});

io.sockets.on('connection', function (socket) {
    function refresh (key) {
        key = key || 'nodes';
        r.connect(config.database).then(function (c) {
            this.connection = c;
            return r.table('currentNetwork')
                .get(key + '.json')
                .run(c);
        }).then(function (data) {
            socket.emit('refresh', data);
        }).then(function () {
            this.connection.close();
        });
    }

    socket.on('refresh', refresh);
    refresh();
});
