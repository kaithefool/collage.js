'use strict';

var util = require('./../lib/util.js'),
    resize = require('./../lib/resize.js');

module.exports = Img;

var defaults = {
    uploader: null,
    url: null,
    params: null,
    mode: 'bg'
};

function Img (src, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.setEl();

    if (src instanceof File) {
        // if file is provided as source
        this.file = src;
        this.setEl(this.opts.uploader);
        this.readFile(src);

        // upload file
        if (this.opts.uploader) {
            this.upload();
        }
    } else {
        // url as source
        this.setEl();
        this.setSrc(src);
    }
}

Img.prototype = {

    setEl: function (progress) {
        this.el = util.createElement('<span class="collage-img"></span>');

        // inline mode
        if (this.opts.mode === 'inline') {
            this.img = new Image();
            this.el.appendChild(this.img);
        }
        // bg mode
        if (this.opts.mode === 'bg') {
            this.el.className += ' collage-img-bg';
        }

        // progress
        if (progress) {
            this.el.appendChild(util.createElement(
                '<div class="collage-progress">' +
                    '<div class="progress-bar"></div>' +
                    '<div class="progress-text"></div>' +
                '</div>'
            ));
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

        this.setSrc(src);
    },

    onerr: function () {

    },

    setSrc: function (src) {
        if (this.opts.mode === 'bg') {
            this.el.style = 'background-image: url(' + src + ')';
        } else {
            this.img.src = src;
        }
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
        this.setSrc(res);
        this.progress.parentNode.removeChild(this.progress);
    },

    onprogress: function (task, progress) {
        this.setProgress(progress);
    },

    onfail: function () {
        this.text.innerHTML = 'Upload Failed';
    }

};
