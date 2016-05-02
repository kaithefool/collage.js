module.exports = function (grunt) {

    'use strict';

    grunt.config.set('uglify', {
        dist: {
            files: {
                'dist/js/collage.min.js': ['dist/js/collage.js']
            }
        }
    });

};
