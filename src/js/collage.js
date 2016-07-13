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
    sortable: true
};

function Collage (el, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.el = el;

    // setup uploader
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


        var list = el.querySelector('.collage-list');
        if (list && this.opts.sortable) {
            this.list = list;
            this.sortable = new Sortable(list);
        }
    }
}

Collage.prototype = util.extend({

    uploader: null,

    add: function (items) {
        if (Array.isArray(items)) {
            items.forEach(function (item) {
                this._add(item);
            }.bind(this));
        }
    },

    _add: function (item) {
        var img = this.img(item);

        if (this.list) {
            this.list.appendChild(img.el);
        }

        // sortable
        if (this.sortable) {
            this.sortable.add(img.el);
        }

        this.publish('onadd', img);
    },

    img: function (src) {
        return new Img(src, {
            uploader: this.uploader
        });
    },

    onfile: function (file) {
        this._add(file);
    }

}, util.pubsub);
