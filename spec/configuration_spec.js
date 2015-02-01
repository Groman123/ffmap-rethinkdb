describe('Configuration options', function () {
    'use strict';
    var expect = require('chai').expect;

    describe('with defaults', function () {
        var conf = require('../config.js').defaults;
        it('should configure port 8000', function () {
            expect(conf).to.have.ownProperty('port');
            expect(conf.port).to.equal(8000);
        });

        describe('for database', function () {
            it('should export the database config', function () {
                expect(conf).to.have.ownProperty('database');
                expect(conf.database).to.be.an('object');
            });
            it('should use default rethinkdb port', function () {
                var db = conf.database;
                expect(db.port).to.equal('28015');
            });
            it('should use default database "ffmap"', function () {
                var db = conf.database;
                expect(db.db).to.equal('ffmap');
            });
        });

        describe('for data sources', function () {
            it('should be an array to support multiple sources', function () {
                var sources = conf.dataSources;
                expect(sources).to.be.an('array');
            });
            it('should contain some local files from tmp/ directory', function () {
                var sources = conf.dataSources;
                var local = sources.filter(function (src) {
                    return src.type === 'local' && src.base === 'tmp/';
                })[0];
                expect(local).to.have.ownProperty('endpoints');

                expect(local.endpoints).to.be.an('array');
                expect(local.interval).to.equal(3000);
            });
        });
    });
});
