/* jshint node: true */
module.exports = function (grunt)
{
    'use strict';

    // Track the time of each task
    require('time-grunt')(grunt);

    // Lazy Load
    require('jit-grunt')(grunt, {
        usebanner: 'grunt-banner'
    });

    // read project settings for package.json
    grunt.config.set('pkg', grunt.file.readJSON('package.json'));

    // Load the include-all library in order to require all of our grunt
    // configurations and task registrations dynamically.
    var includeAll = require('include-all');

    /**
    * Loads Grunt configuration modules from the specified
    * relative path. These modules should export a function
    * that, when run, should either load/configure or register
    * a Grunt task.
    */
    function loadTasks(relPath) {
        return includeAll({
            dirname: require('path').resolve(__dirname, relPath),
            filter: /(.+)\.js$/
        }) || {};
    }

    /**
    * Invokes the function from a Grunt configuration module with
    * a single argument - the `grunt` object.
    */
    function invokeConfigFn(tasks) {
        for (var taskName in tasks) {
            if (tasks.hasOwnProperty(taskName)) {
                tasks[taskName](grunt);
            }
        }
    }
    invokeConfigFn( loadTasks('./tasks') );

    /**
     * Tasks
     */
    grunt.registerTask('js', ['browserify', 'uglify']);
    grunt.registerTask('default', ['clean', 'js', 'less', 'watch']);

};
