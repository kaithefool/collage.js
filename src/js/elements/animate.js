'use strict';

var util = require('./../lib/util.js');

var easings = {
    // no easing, no acceleration
    linear: function (t) { return t; },
    // accelerating from zero velocity
    easeInQuad: function (t) { return t*t; },
    // decelerating to zero velocity
    easeOutQuad: function (t) { return t*(2-t); },
    // acceleration until halfway, then deceleration
    easeInOutQuad: function (t) { return t<0.5 ? 2*t*t : -1+(4-2*t)*t; },
    // accelerating from zero velocity
    easeInCubic: function (t) { return t*t*t; },
    // decelerating to zero velocity
    easeOutCubic: function (t) { return (--t)*t*t+1; },
    // acceleration until halfway, then deceleration
    easeInOutCubic: function (t) { return t<0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; },
    // accelerating from zero velocity
    easeInQuart: function (t) { return t*t*t*t; },
    // decelerating to zero velocity
    easeOutQuart: function (t) { return 1-(--t)*t*t*t; },
    // acceleration until halfway, then deceleration
    easeInOutQuart: function (t) { return t<0.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t; },
    // accelerating from zero velocity
    easeInQuint: function (t) { return t*t*t*t*t; },
    // decelerating to zero velocity
    easeOutQuint: function (t) { return 1+(--t)*t*t*t*t; },
    // acceleration until halfway, then deceleration
    easeInOutQuint: function (t) { return t<0.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t; }
};

function parseUnit (value) {
    var matches = value.match(/(\d*)(\D*)/i);

    return {
        value: matches[1],
        unit: matches[2]
    };
}

function parseTransform (transform) {
    var values = transform.split(/,\s?/);

    values.forEach(function (value, i, arr) {
        arr[i] = parseUnit(value);
    });

    return values;
}

function parseKeyframe (keyframe) {
    var frame = {};

    for (var prop in frame) {
        frame[prop] = parseTransform(frame[prop]);
    }

    return frame;
}

function

function transform (el, transform) {
    el.style.webkitTransform = transform;
    el.style.MozTransform = transform;
    el.style.OTransform = transform;
    el.style.transform = transform;
}

var defaults = {
    timingFunc: 'easeOutQuad',
    duration: 1000
};

function Anim (el, keyframes, opts) {
    this.el = el;
    this.keyframes = this.parseKeyframes(keyframes);
    this.opts = util.extend({}, defaults, opts);

    // start
    this.start = new Date().getTime();
    this.frame();
}

Anim.prototype = {

    parseKeyframes: function (keyframes) {
        var fs = [];

        keyframes.forEach(function (frame) {
            fs.push(parseKeyframe(frame));
        });

        return fs;
    },

    frame: function () {
        this.render();

        if (!this.pause) {
            window.requestAnimationFrame(this.frame.bind(this));
        }
    },

    render: function () {

    },

    transform: function (from, to) {
        
    },

    progress: function () {
        var t = (new Date().getTime() - this.start) / this.opts.duration;

        // progress has to be less than or equal to 1
        t = t >= 1 ? 1 : t;

        // apply easing function
        return easings[this.opts.timeingFunc](t);
    },

    ondone: function () {

    }

};

module.exports = function (el, keyframes, opts) {
    return new Anim(el, keyframes, opts);
};
