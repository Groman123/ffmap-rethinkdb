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
                src: ['*.js', '!Gruntfile.js', 'util/**/*.js', 'ffmap/**/*.js', 'spec/**/*.js']
            },
            grunt: {
                src: ['Gruntfile.js', 'tasks/**/*.js']
            }
        },
        jscs: {
            options: {
                config: '.jscsrc'
            },
            app: {
                files: {
                    src: ['*.js', 'ffmap/**/*.js', '!Gruntfile.js', 'spec/**/*.js']
                }
            },
            grunt: {
                files: {
                    src: ['Gruntfile.js', 'tasks/**/*.js']
                }
            }
        },
        mochacli: {
            spec: {
                options: {
                    reporter: 'spec'
                },
                files: [{
                    src: ['spec/**/*_spec.js']
                }]
            }
        },
        watch: {
            app: {
                files: ['*.js', 'ffmap/**/*.js', 'util/**/*.js', '!Gruntfile.js'],
                tasks: ['default', 'docker:reload']
            },
            spec: {
                files: ['spec/**/*'],
                tasks: ['lint', 'test']
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
    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.loadTasks('tasks');

    grunt.registerTask('lint', ['eslint', 'jscs']);
    grunt.registerTask('build', []);
    grunt.registerTask('test', ['mochacli']);

    grunt.registerTask('default', ['lint', 'build', 'test']);
};
