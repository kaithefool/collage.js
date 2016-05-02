'use strict';

var UploadTask = require('./UploadTask'),
    util = require('./util.js');

module.exports = FileUploader;

function FileUploader () {

}

FileUploader.prototype = {

    parallel: 3,

    timeoutRetry: 2,

    queue: [],

    processing: [],

    url: null,

    params: null,

    upload: function (file, url, params) {
        url = url ? url : this.url;
        params = params ? params : this.params;

        var task = new UploadTask(url, file, params);

        // callbacks
        task.subscribe('success', this.onsuccess.bind(this));
        task.subscribe('fail', this.onfail.bind(this));
        task.subscribe('timeout', this.ontimeout.bind(this));

        if (this.processing.length >= this.parallel) {
            this.queue.push(task);
        } else {
            this.run(task);
        }

        return task;
    },

    run: function (task) {
        this.processing.push(task);
        task.submit();
    },

    done: function (task) {
        util.remove(this.processing, task);

        // run next task
        if (this.queue.length > 1) {
            var next = this.queue[0];

            this.run(next);
            util.remove(this.queue, next);
        }
    },

    onsuccess: function (task) {
        this.done(task);
    },

    onfail: function (task) {
        this.done(task);
    },

    ontimeout: function (task) {
        if (task.timeouts > this.timeoutRetry) {
            task.onfail();
        } else {
            // submit again
            task.submit();
        }
    }

};
