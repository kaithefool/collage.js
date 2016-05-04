'use strict';

var util = require('./../lib/util.js');

module.exports = Img;

var defaults = {
    uploader: null,
    url: null,
    params: null,
    src: null
};

function Img (file, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.file = file;
    this.setEl();

    if (this.opts.uploader) {
        this.upload();
    }
}

Img.prototype = {

    setEl: function () {
        this.el = document.createElement('div');

        this.el.className = 'collage-img';
        this.el.innerHTML = '<div class="progress"><div class="progress-bar"></div><div class="progress-text"></div></div>';
        this.bar = this.el.querySelector('.progress-bar');
        this.text = this.el.querySelector('progress-text');
    },

    readFile: function (file) {
        var reader = new FileReader();

        reader.onload = this.onread.bind(this);
        reader.onerr = this.onerr.bind(this);
        reader.readAsDataURL(file);
    },

    onread: function (evt) {
        this.setBg(evt.target.result);
    },

    onerr: function () {
        
    },

    setBg: function (url) {
        this.el.style = 'background: url(' + url + ')';
    },

    setProgress: function (progress) {
        this.bar.style = 'width: ' + (progress * 100) + '%';
        this.text.innerHTML = (progress * 100) + '%';
    },

    upload: function () {
        var task = this.opts.uploader.upload(this.file, this.opts.url, this.opts.params);

        task.subscribe('success', this.onsuccess);
        task.subscribe('progress', this.onprogress);
        task.subscribe('fail', this.onfail);
    },

    onsuccess: function (task, res) {
        this.setBg(res);
    },

    onprogress: function (task, progress) {
        this.setProgress(progress);
    },

    onfail: function () {
        this.text.innerHTML = 'Upload Failed';
    }

};
