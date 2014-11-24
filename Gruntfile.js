module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        bump: {
            options: {
                push: false
            },
            files: ['package.json']
        },
        eslint: {
            sources: {
                src: ['*.js', '!Gruntfile.js', 'util/**/*.js', 'ffmap/**/*.js']
            },
            grunt: {
                src: ['Gruntfile.js']
            }
        },
        jscs: {
            options: {
                config: '.jscsrc'
            },
            app: {
                files: {
                    src: ['*.js', 'ffmap/**/*.js', '!Gruntfile.js']
                }
            },
            grunt: {
                files: {
                    src: ['Gruntfile.js']
                }
            }
        },
        watch: {
            app: {
                files: ['*.js', 'ffmap/**/*.js', '!Gruntfile.js'],
                tasks: ['default']
            },
            grunt: {
                options: {
                    reload: true
                },
                files: ['Gruntfile.js', 'tasks/**/*.js'],
                tasks: ['jscs:grunt']
            }
        }
    });

    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('lint', ['eslint', 'jscs']);
    grunt.registerTask('build', []);
    grunt.registerTask('test', []);

    grunt.registerTask('default', ['lint', 'build', 'test']);
};
