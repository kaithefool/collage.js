module.exports = function (grunt) {

    'use strict';

    grunt.config.set('requirejs', {
        options: {
            useStrict: true,
            optimize: 'uglify2',
            preserveLicenseComments: false,
            logLevel: 1,
            // wrap: false,
            include: ['../components/requirejs/require']
        },
        compressed: {
            options: {
                optimize: 'uglify2',
                baseUrl: 'src/js',
                mainConfigFile: 'src/js/collage.js',
                name: 'collagejs',
                out: 'dist/js/collage.min.js'
            }
        },
        uncompressed: {
            options: {
                baseUrl: 'src/js',
                mainConfigFile: 'src/js/collage.js',
                name: 'collagejs',
                out: 'dist/js/collage.js'
            }
        }
    });

};
