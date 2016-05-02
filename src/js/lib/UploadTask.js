'use strict';

var util = require('./util.js');

module.exports = UploadTask;

function UploadTask (url, file, params) {
    this.url = url;

    this.data = new FormData();
    this.data.append('file', file);
    if (params instanceof Array) {
        params.forEach(function (input) {
            this.data.append(input.name, input.value);
        });
    }
}

UploadTask.prototype = util.extend({

    timeouts: 0,

    submit: function () {
        var xhr = this.xhr = new XMLHttpRequest();

        // event handlers
        xhr.onprogress = this.onprogress.bind(this);
        xhr.ontimeout = this.ontimeout.bind(this);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    this.onsuccess(xhr);
                } else {
                    this.onfail();
                }
            }
        }.bind(this);

        // send the request
        xhr.timeout = 3000;
        xhr.open('post', this.url);
        xhr.send(this.data);
    },

    onsuccess: function (xhr) {
        this.publish('success', this, xhr.responseText, xhr.status);
    },

    onprogress: function () {
        this.publish('progress', this);
    },

    ontimeout: function () {
        this.timeouts ++;
        this.publish('timeout', this);
    },

    onfail: function () {
        this.publish('fail', this);
    }

}, util.pubsub);
