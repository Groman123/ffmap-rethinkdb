'use strict';

var r = require('rethinkdb');
var express = require('express');
var socketio = require('socket.io');
var _ = require('lodash');

var config = require('./config');
var db = require('./ffmap/db');
var logger = require('./util/logger');

var app = express();
app.use(express.static(config.frontend.path));
var io = socketio.listen(app.listen(config.port), { log: false });

db.init(config).then(function () {
    config.dataSources.forEach(function (src) {
        var aggregate = require('./ffmap/aggregator').for(src.type).aggregate;
        var penality = 1;
        function setup() {
            aggregate(src, config.database).then(function () {
                logger.info('Received data and stored to DB');
                penality = 1;
            }, function () {
                penality = penality * 2;
                logger.warn('Problem fetching data or storing in DB');
            });
            setTimeout(function () {
                setup();
            }, src.interval * penality);
        }

        setup();
    });
});

io.sockets.on('connection', function (socket) {
    var self = this;
    function refresh (key) {
        key = key || 'nodes';

        return function () {
            r.table(key)
                //get rid of datasets older than 1h
                .filter(function (row) {
                    return row('timestamp').gt(r.now().sub(60 * 60)) &&
                         row('name').match('(?i)^' + self.prefixFilter || '');
                })
                .run(self.connection).then(function (data) {
                    socket.emit(key + ':reset');
                    data.toArray(function (err, nodes) {
                        if (err) {
                            logger.warn(err);
                            return;
                        }
                        //split into bunches of 100 nodes and send it
                        nodes.reduce(function (acc, node) {
                            var n = acc[acc.length - 1];
                            if (n.length < 100) {
                                n.push(node);
                            } else {
                                acc.push([node]);
                            }
                            return acc;
                        }, [[]]).forEach(function (n) {
                            socket.emit(key + ':add', n);
                        });
                    });
                });
        };
    }
    function watch (key) {
        key = key || 'nodes';

        var sendUpdate = _.throttle(function (updates, cb) {
            socket.emit(key + ':update', updates);
            cb();
        }, 200, { leading: false });
        r.table(key)
            .changes()
            .filter(function (row) {
                return row('timestamp').gt(r.now().sub(60 * 60)) &&
                    row('new_val')('name').match('(?i)^' + self.prefixFilter || '');
            })
            .run(self.connection).then(function (data) {
                var updates = [];
                data.each(function (err, node) {
                    if (err) {
                        logger.warn(err);
                        //just ignore error
                        return;
                    }
                    if (node.old_val === null) {
                        socket.emit(key + ':add', node.new_val);
                    } else if (node.new_val === null) {
                        socket.emit(key + ':remove', node.old_val.id);
                    } else if (node.new_val && node.old_val) {
                        updates.push(node.new_val);
                    }
                    sendUpdate(updates, function () {
                        updates = [];
                    });
                });
            });
    }

    socket.on('refresh:nodes', refresh('nodes'));
    socket.on('refresh:links', refresh('links'));
    socket.on('communities:index', function () {
        r.table('communities')
            .run(self.connection).then(function (data) {
                return data.toArray();
            }).then(function (communities) {
                socket.emit('communities:index', communities);
            });
    });
    socket.on('communities:applyFilter', function (name) {
        r.table('communities')
            .get(name)
            .run(self.connection).then(function (community) {
                self.prefixFilter = community.prefix;
                refresh('nodes')();
                refresh('links')();
            });
    });
    r.connect(config.database).then(function (c) {
        self.connection = c;

        watch('nodes');
        watch('links');
    });
});
