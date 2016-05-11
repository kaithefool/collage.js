'use strict';

var util = require('./../lib/util.js');

module.exports = FileDrop;

var defaults = {
    maxsize: 10,
    format: 'jpe?g|png|gif'
};

function stopEvt (evt) {
    evt.preventDefault();
    evt.stopPropagation();
}

function FileDrop (el, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.el = el;
    this.input = el.querySelector('input[type="file"]');

    // events
    this.el.addEventListener('drop', this.ondrop.bind(this));
    this.el.addEventListener('dragenter', stopEvt);
    this.el.addEventListener('dragover', stopEvt);
    if (this.input) {
        this.input.addEventListener('change', this.ondrop.bind(this));
    }
}

FileDrop.prototype = util.extend({

    validate: function (file) {
        var size = file.size / (1000000) <= this.opts.maxsize,
            format = file.name.match('\.(' + this.opts.format + ')$');

        return size && format;
    },

    ondrag: function () {

    },

    ondrop: function (evt) {
        evt.preventDefault();

        // get files
        var files = evt.currentTarget.files ? evt.currentTarget.files : evt.dataTransfer.files;

        for (var i = 0; i < files.length; i++) {
            // restrict files per drop
            if (i > 20) {
                break;
            }

            var test = this.validate(files[i]);
            if (test) {
                this.publish('file', files[i]);
            } else {

            }
        }
    }

}, util.pubsub);
