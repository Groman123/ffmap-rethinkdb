var r = require('rethinkdb');
var Promise = require('es6-promise').Promise;

var noop = function () {};
var log = function (msg) {
    return function () {
        console.log('Created', msg);
        return arguments;
    }
}

function init(config) {
    return r.connect(config.database).then(function (c) {
        var op = r.dbCreate(config.database.db)
            .run(c)
            .then(log('database "' + config.database.db + '"'), noop);
        return Promise.all([c, op]);
    }).then(function (res) {
        var c = res[0];
        var db = res[1];
        var ops = [c, db];

        ops.push(r.tableCreate('nodes')
            .run(c)
            .then(log('table "nodes"'), noop)
        );
        ops.push(r.tableCreate('graph')
            .run(c)
            .then(log('table "graph"'), noop)
        );
        ops.push(r.tableCreate('currentNetwork')
            .run(c)
            .then(log('table "currentNetwork"'), noop)
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
