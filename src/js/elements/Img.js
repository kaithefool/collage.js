'use strict';

var util = require('./../lib/util.js');

module.exports = Img;

var defaults = {
    uploader: null,
    url: null,
    params: null
};

function Img (file, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.file = file;
    this.el = document.createElement('img');

    if (this.opts.uploader) {
        this.upload();
    }
}

Img.prototype = {

    readFile: function (file) {
        var reader = new FileReader();

        reader.onload = this.onread.bind(this);
        reader.onerr = this.onerr.bind(this);
        reader.readAsDataURL(file);
    },

    onread: function (evt) {
        this.el.src = evt.target.result;
    },

    onerr: function () {

    },

    upload: function () {
        var task = this.opts.uploader.upload(this.file, this.opts.url, this.opts.params);

        task.subscribe('success', this.onsuccess);
        task.subscribe('progress', this.onprogress);
        task.subscribe('fail', this.onfail);
    },

    onsuccess: function (task, res) {
        this.el.src = res;
    },

    onprogress: function () {
        
    },

    onfail: function () {}

};
