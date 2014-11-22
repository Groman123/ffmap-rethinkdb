module.exports = {
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
        path: __dirname + '/../ffmap-d3/build/'
    },
    database: {
        host: 'db.example.com',
        port: '28015',
        db: 'ffmap'
    },

    port: 8000
};
