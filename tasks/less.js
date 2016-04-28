module.exports = function (grunt) {

    'use strict';

    grunt.config.set('less', {
        options: {
            strictImports: true
        },
        compressed: {
            options: {
                compress: true
            },
            files: {
                'dist/css/collage.min.css': 'src/less/collage.less'
            }
        },
        uncompressed: {
            options: {
                dumpLineNumbers: 'comments'
            },
            files: {
                'dist/css/collage.css': 'src/less/collage.less'
            }
        }
    });

};
