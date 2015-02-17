'use strict';

var r = require('rethinkdb');
var Promise = require('es6-promise').Promise;

var noop = function () {};
var logger = require('../util/logger');
var log = function (msg) {
    return function () {
        logger.debug(msg);
        return arguments;
    };
};

function init(config) {
    return r.connect(config.database).then(function (c) {
        var op = r.dbCreate(config.database.db)
            .run(c)
            .then(log('Created database "' + config.database.db + '"'), noop);
        return Promise.all([c, op]);
    }).then(function (res) {
        var c = res[0];
        var db = res[1];
        var ops = [c, db];

        ops.push(r.tableCreate('nodes')
            .run(c)
            .then(log('Created table "nodes"'), noop)
        );
        ops.push(r.tableCreate('links')
            .run(c)
            .then(log('Created table "links"'), noop)
        );
        ops.push(r.tableCreate('currentNetwork')
            .run(c)
            .then(log('Created table "currentNetwork"'), noop)
        );
        ops.push(r.table('nodes').indexCreate('location', r.row('nodeinfo')('location'), { geo: true })
            .run(c)
            .then(log('Created index on nodeinfo.location for nodes table'), noop)
        );

        return Promise.all(ops);
    }).then(function closeConnection(res) {
        var c = res[0];
        if (c && c.open) {
            c.close();
        }
    });
}

module.exports = {
    init: init
};
