module.exports = function (grunt) {
    grunt.initConfig({
        bump: {
            options: {
                push: false
            },
            files: ['package.json']
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
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('lint', ['jscs']);
    grunt.registerTask('build', []);
    grunt.registerTask('test', []);

    grunt.registerTask('default', ['lint', 'build', 'test']);
};
