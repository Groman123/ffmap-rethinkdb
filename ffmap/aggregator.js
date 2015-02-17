'use strict';

var request = require('request');
var r = require('rethinkdb');
var Promise = require('es6-promise').Promise;
var _ = require('lodash');

var Aggregator = function Aggregator(options) {
    var self = this;

    this.parseJSON = function parseJSON(body) {
        var data;
        try {
            data = JSON.parse(body);
        } catch (e) {
            return Promise.reject(e);
        }
        return Promise.resolve(data);
    };

    this.normalize = function normalize(json) {
        if (json.nodes) {
            json.nodes = json.nodes.map(function (node) {
                node.nodeinfo = node.nodeinfo || {};
                if (_.isArray(node.geo) && node.geo.length === 2) {
                    node.nodeinfo.location = r.geojson({
                        type: 'Point',
                        coordinates: [node.geo[1], node.geo[0]]
                    });
                    delete node.geo;
                }
                if (node.firmware) {
                    node.nodeinfo.software = node.nodeinfo.software || {};
                    node.nodeinfo.software.firmware = node.firmware;
                    delete node.firmware;
                }
                node.neighbours = [];
                return node;
            });
        }
        if (json.links) {
            json.links = json.links.map(function (link) {
                if (!link.type) {
                    link.type = 'node';
                }
                if (json.nodes &&
                    json.nodes[link.target] &&
                    json.nodes[link.source])
                {
                    json.nodes[link.target].neighbours.push(json.nodes[link.source].id);
                    json.nodes[link.source].neighbours.push(json.nodes[link.target].id);
                }

                link.target = json.nodes && json.nodes[link.target].id || link.target;
                link.source = json.nodes && json.nodes[link.source].id || link.source;

                return link;
            });
        }
        return json;
    };

    this.writeJSON = function (json) {
        var meta = {
            id: json.id,
            meta: json.meta
        };
        return r.db(self.dbConfig.db)
            .table('currentNetwork')
            .insert(meta, { returnChanges: false, conflict: 'replace' })
            .run(self.connection)
            .then(function () {
                return r.db(self.dbConfig.db)
                    .table('nodes')
                    .insert(json.nodes || [], { returnChanges: false, conflict: 'update' })
                    .run(self.connection);
            }).then(function () {
                return r.db(self.dbConfig.db)
                    .table('links')
                    .insert(json.links || [], { returnChanges: false, conflict: 'update' })
                    .run(self.connection);
            });
    };

    this.finish = function finish(res) {
        if (self.connection && self.connection.open) {
            self.connection.close();
        }
        return res;
    };

    _.merge(this, options);

    this.aggregate = function aggregate(backend, dbConfig) {
        self.dbConfig = dbConfig || self.dbConfig;
        return r.connect(dbConfig).then(function (c) {
            self.connection = c;
            return Promise.all(backend.endpoints.map(function (id) {
                return self.fetchData(backend.base + '/' + id)
                    .then(self.parseJSON)
                    .then(function addMetaDataData(json) {
                        json.id = backend.base + '/' + id;
                        if (!json.timestamp) {
                            json.timestamp = new Date().toISOString();
                        }
                        return json;
                    })
                    .then(self.normalize)
                    .then(self.writeJSON);
            }));
        }).then(self.finish);
    };
};

var api = {};

api.remote = new Aggregator({
    fetchData: function (path) {
        return new Promise(function (resolve, reject) {
            request(path, function (err, res, body) {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }
});

api.local = new Aggregator({
    fetchData: function (path) {
        var fs = require('fs');

        return new Promise(function (resolve, reject) {
            fs.readFile(path, function (err, content) {
                if (err) {
                    reject(err);
                } else {
                    resolve(content);
                }
            });
        });
    }
});

module.exports = {
    for: function (type) {
        return api[type];
    }
};
