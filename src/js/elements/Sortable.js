'use strict';

var util = require('./../lib/util.js');

module.exports = Sortable;

function Sortable (el, selector) {
    this.selector = selector ? selector : '.collage-img';

    el.addEventListener('mousedown', this.onmousedown.bind(this));
}

Sortable.prototype = util.extend({

    onmousedown: function (evt) {
        if (util.matches(evt.target, this.selector)) {
            
        }
    },

    onmouseover: function () {

    },

    onmouseup: function () {

    },

    on: function () {}

}, util.pubsub);
