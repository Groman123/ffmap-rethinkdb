module.exports = function (grunt) {
    'use strict';

    grunt.registerTask('docker:reload', function () {
        var done = this.async();
        var process = require('child_process');
        var c = process.spawn('docker', ['restart', 'ffmap']);

        c.on('exit', done);
    });
};
