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
                    node.nodeinfo.location = {
                        latitude: node.geo[0],
                        longitude: node.geo[1]
                    };
                    delete node.geo;
                }
                if (node.firmware) {
                    node.nodeinfo.software = node.nodeinfo.software || {};
                    node.nodeinfo.software.firmware = node.firmware;
                    delete node.firmware;
                }
                return node;
            });
        }
        return json;
    };

    this.writeJSON = function (json) {
        return r.db(self.dbConfig.db)
            .table('currentNetwork')
            .replace(json, { returnChanges: false })
            .run(self.connection);
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
                        json.id = id;
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
