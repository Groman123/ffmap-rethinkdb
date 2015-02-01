var _ = require('lodash');
var localConfig = {};
try {
    localConfig = require('./config.local');
} catch (e) {
    console.log(e.code === 'MODULE_NOT_FOUND');
    if (e.code !== 'MODULE_NOT_FOUND' || e.message.indexOf('config.local') < 0) {
        //config.local module is broken, rethrow the exception
        throw e;
    }
}
var path = require('path');

var defaultConfig = {
    dataSources: [
        {
            type: 'local',
            base: 'tmp/',
            endpoints: ['nodes.json', 'graph.json'],
            interval: 3000
        }
//     {
//         type: 'remote',
//         base: 'http://example.com/ffmap/',
//         endpoints: ['nodes.json', 'graph.json'],
//         interval: 30000
//     },
    ],
    frontend: {
        path: path.join(__dirname, 'public')
    },
    database: {
        host: 'rethinkdb',
        port: '28015',
        db: 'ffmap'
    },

    port: 8000
};

module.exports = _.defaults({
    defaults: defaultConfig
}, localConfig, defaultConfig);
