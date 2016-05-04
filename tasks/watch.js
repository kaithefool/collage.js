module.exports = function (grunt) {

    'use strict';

    grunt.config.set('watch', {
        options: {
            interrupt: true
        },
    	js: {
    		files: ['src/js/**/*'],
    		tasks: ['browserify']
    	},
        css: {
            files: ['src/less/**/*'],
    		tasks: ['less']
        }
    });

};
