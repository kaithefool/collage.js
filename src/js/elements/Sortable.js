'use strict';

var util = require('./../lib/util.js');

module.exports = Sortable;

function Sortable (el) {

}

Sortable.prototype = util.extend({

    onmousedown: function () {
        
    },

    onmouseover: function () {

    },

    onmouseup: function () {

    }

}, util.pubsub);
