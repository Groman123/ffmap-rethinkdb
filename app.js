'use strict';

var r = require('rethinkdb');
var express = require('express');
var socketio = require('socket.io');

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

(new (function importData() {
    var self = this;

    return function () {
        return r.connect(config.database).then(function (c) {
            self.connection = c;
            c.use(config.database.db);

            return r.table('currentNetwork')
                .get('nodes.json')
                .changes()
                .run(c)
                .then(function (res) {
                    return res.each(function (err, n) {
                        if (err) {
                            logger.warn(err);
                            throw err;
                        }
                        var nodes = n.nodes;
                        for (var id in nodes) {
                            var node = nodes[id];
                            node.id = id;
                            r.table('nodes').insert(node, {
                                conflict: 'update'
                            }).run(self.connection);
                        }
                        if (n.links) {
                            for (id in n.links) {
                                var link = n.links[id];
                                r.table('links').insert(link, {
                                    conflict: 'update'
                                }).run(self.connection);
                            }
                        }
                    });
                });
        });
    };
})())();

io.sockets.on('connection', function (socket) {
    var self = this;
    function refresh (key) {
        key = key || 'nodes';
        return r.connect(config.database).then(function (c) {
            self.connection = c;
            r.table('nodes')
                .run(c).then(function (data) {
                    socket.emit('nodes:reset');
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
                            socket.emit('nodes:add', n);
                        });
                    });
                });
            r.table('links')
                .run(c).then(function (data) {
                    socket.emit('links:reset');
                    data.toArray(function (err, links) {
                        if (err) {
                            logger.warn(err);
                            return;
                        }
                        //FIXME: be more DRY!
                        //split into bunches of 100 nodes and send it
                        links.reduce(function (acc, link) {
                            var l = acc[acc.length - 1];
                            if (l.length < 100) {
                                l.push(link);
                            } else {
                                acc.push([link]);
                            }
                            return acc;
                        }, [[]]).forEach(function (l) {
                            socket.emit('links.add', l);
                        });
                    });
                });
        });
    }

    socket.on('refresh', refresh);
    refresh().then(function () {
        r.table('nodes')
            .changes()
            .run(self.connection).then(function (data) {
                data.each(function (err, node) {
                    if (err) {
                        logger.warn(err);
                        //just ignore error
                        return;
                    }
                    socket.emit('nodes:update', node);
                });
            });
        r.table('links')
            .changes()
            .run(self.connection).then(function (data) {
                data.each(function (err, link) {
                    if (err) {
                        logger.warn(err);
                        //just ignore error
                        return;
                    }
                    socket.emit('links:update', link);
                });
            });
    });
});
