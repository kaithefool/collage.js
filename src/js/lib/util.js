'use strict';

module.exports = {

    transition: function (el, transition) {
        el.style.webkitTransition = transition;
        el.style.MozTransition = transition;
        el.style.OTransition = transition;
        el.style.transition = transition;
    },

    transform: function (el, transform) {
        el.style.webkitTransform = transform;
        el.style.MozTransform = transform;
        el.style.OTransform = transform;
        el.style.transform = transform;
    },

    createElement: function (html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.firstChild;
    },

    /**
     * Check if element would be selected by the specified selector string
     */
    matches: function (el, selector) {
        var p = Element.prototype;
    	var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s) {
    		return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
    	};
    	return f.call(el, selector);
    },

    /**
     * Event delegation
     * @param  {Element}    el          Parent Node
     * @param  {String}     evtType
     * @param  {String}     selector
     * @param  {Function}   callback
     * @return
     */
    on: function (el, evtType, selector, callback) {
        el.addEventListener(evtType, function (evt) {
            if (this.matches(evt.target, selector)) {
                callback.apply(window, arguments);
            }
        }.bind(this));
    },

    /**
     * Remove value from array
     */
    remove: function (array, el) {
        array.splice(array.indexOf(el), 1);
    },

    extend: function () {
        var obj = arguments[0],
            src;

        for (var i = 1; i < arguments.length; i++) {
            src = arguments[i];
            for (var key in src) {
                if (src.hasOwnProperty(key)) obj[key] = src[key];
            }
        }

        return obj;
    },

    /**
     * Publish / Subscribe Pattern
     * @type {Object}
     */
    pubsub: {
        subscribe: function (topic, handler) {
            if (!this._observers) {
                this._observers = {};
            }

            var a = this._observers[topic];

            if (!(a instanceof Array)) {
                a = this._observers[topic] = [];
            }
            a.push(handler);
        },

        unsubscribe: function (topic, handler) {
            var a = this._observers[topic];

            a.splice(a.indexOf(handler), 1);
        },

        publish: function (topic) {
            if (!this._observers) {
                this._observers = {};
            }

            var a = this._observers[topic],
                args = Array.prototype.slice.call(arguments, 1);

            if (a) {
                for (var i = 0; i < a.length; i++) {
                    a[i].apply(this, args);
                }
            }
        }
    }

};
