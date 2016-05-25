'use strict';

var util = require('./../lib/util.js');

module.exports = Sortable;

function swap (el0, el1) {
    var el0Next = el0.nextSibling,
        el1Next = el1.nextSibling;

    el0.parentNode.insertBefore(el0, el1Next);
    el1.parentNode.insertBefore(el1, el0Next);
}

function Sortable (el, selector) {
    this.selector = selector ? selector : '.collage-img';

    el.addEventListener('mousedown', this.onmousedown.bind(this));
    el.addEventListener('mousemove', this.onmousemove.bind(this));
    el.addEventListener('mouseup', this.onmouseup.bind(this));

    el.className += 'collage-sortable';
}

Sortable.prototype = util.extend({

    target: null,

    onmousedown: function (evt) {
        if (util.matches(evt.target, this.selector)) {
            this.target = evt.target;
        }
    },

    onmousemove: function (evt) {
        if (!this.target) {
            return;
        }

        if (util.matches(evt.target, this.selector) && evt.target !== this.target) {
            swap(evt.target, this.target);
        }
    },

    onmouseup: function () {
        this.target = null;
    },

    swap: function (el0, el1) {
        
    },

    on: function () {}

}, util.pubsub);
