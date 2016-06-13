'use strict';

var FileUploader = require('./lib/FileUploader.js'),
    FileDrop = require('./elements/FileDrop.js'),
    Img = require('./elements/Img.js'),
    Sortable = require('./elements/Sortable.js'),
    util = require('./lib/util.js');

module.exports = Collage;

var defaults = {
    uploader: null,
    fileDrop: {},
    sortable: true,
    media: []
};

function Collage (el, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.el = el;

    var form = el.querySelector('form');
    if (this.opts.uploader) {
        this.uploader = new FileUploader(this.opts.uploader);
    } else if (form) {
        this.uploader = new FileUploader({
            form: form
        });
    }

    if (el) {
        if (this.opts.fileDrop) {
            this.filedrop = new FileDrop(el, this.opts.fileDrop);
            this.filedrop.subscribe('file', this.onfile.bind(this));
        }

        if (this.opts.sortable) {
            this.list = el.querySelector('.collage-list');
            this.sortable = new Sortable(this.list);
        }
    }
}

Collage.prototype = util.extend({

    uploader: null,

    img: function (file) {
        return new Img(file, {
            uploader: this.uploader
        });
    },

    onfile: function (file) {
        var img = this.img(file);

        if (this.list) {
            this.list.appendChild(img.el);
        }

        this.publish('onfile', img);
    }

}, util.pubsub);
