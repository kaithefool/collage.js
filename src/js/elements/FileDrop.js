'use strict';

module.exports = FileDrop;

function FileDrop (el) {
    this.el = el;
    this.input = el.querySelector('input[type="file"]');

    // events
    this.el.addEventListener('drop', this.ondrop.bind(this));
    this.el.addEventListener('dragdrop', this.ondrop.bind(this));
    if (this.input) {
        this.el.addEventListener('change', this.ondrop.bind(this));
    }
}

FileDrop.prototype = {

    ondrop: function (evt) {
        evt.preventDefault();

        // get files
        var files = evt.currentTarget.files ? evt.currentTarget.files : evt.originalEvent.dataTransfer.files;

        // restrict files per drop
        files.splice(20);

        
    }

};
