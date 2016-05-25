'use strict';

var util = require('./../lib/util.js'),
    resize = require('./../lib/resize.js');

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
    this.readFile(file);

    if (this.opts.uploader) {
        this.upload();
    }
}

Img.prototype = {

    setEl: function () {
        this.el = document.createElement('div');

        this.el.className = 'collage-img';

        // progress
        if (this.opts.uploader) {
            this.el.innerHTML = '<div class="collage-progress"><div class="progress-bar"></div><div class="progress-text"></div></div>';
            this.progress = this.el.querySelector('.collage-progress');
            this.bar = this.el.querySelector('.progress-bar');
            this.text = this.el.querySelector('.progress-text');
        }
    },

    readFile: function (file) {
        var reader = new FileReader();

        reader.onload = this.onread.bind(this);
        reader.onerr = this.onerr.bind(this);
        reader.readAsDataURL(file);
    },

    onread: function (evt) {
        var src = resize(evt.target.result, 500, 500);

        this.setBg(src);
    },

    onerr: function () {

    },

    setBg: function (url) {
        this.el.style = 'background-image: url(' + url + ')';
    },

    setProgress: function (progress) {
        progress = Math.round(progress * 100);
        this.bar.style = 'width: ' + progress + '%';
        this.text.innerHTML = progress + '%';
    },

    upload: function () {
        var task = this.opts.uploader.upload(this.file, this.opts.url, this.opts.params);

        task.subscribe('success', this.onsuccess.bind(this));
        task.subscribe('progress', this.onprogress.bind(this));
        task.subscribe('fail', this.onfail.bind(this));
    },

    onsuccess: function (task, res) {
        this.setBg(res);
        this.progress.parentNode.removeChild(this.progress);
    },

    onprogress: function (task, progress) {
        this.setProgress(progress);
    },

    onfail: function () {
        this.text.innerHTML = 'Upload Failed';
    }

};
