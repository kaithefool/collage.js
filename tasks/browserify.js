module.exports = function (grunt) {

    'use strict';

    grunt.config.set('browserify', {
        options: {
            browserifyOptions: {
                debug: true,
                standalone: 'Collage'
            }
        },
        uncompressed: {
            files: {
                'dist/js/collage.js': ['src/js/collage.js']
            }
        }
    });

};
