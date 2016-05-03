'use strict';

var FileUploader = require('./lib/FileUploader.js'),
    Img = require('./elements/Img.js');

module.exports = Collage;

var defaults = {

};

function Collage () {
    this.uploader = new FileUploader();
}

Collage.prototype = {

    img: function (file) {
        return new Img(file, {
            uploader: this.uploader
        });
    }

};
