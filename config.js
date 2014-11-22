var _ = require('lodash');
var localConfig = require('./config.local') || {};
var path = require('path');

module.exports = _.defaults(localConfig, {
//     backend: {
//         type: 'remote',
//         base: 'http://example.com/ffmap/',
//         endpoints: ['nodes.json', 'graph.json'],
//         interval: 30000
//     },
    backend: {
        type: 'local',
        base: 'tmp/',
        endpoints: ['nodes.json', 'graph.json'],
        interval: 3000
    },
    frontend: {
        path: path.join(__dirname, 'public')
    },
    database: {
        host: 'db.example.com',
        port: '28015',
        db: 'ffmap'
    },

    port: 8000
});
