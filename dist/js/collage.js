(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Collage = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var FileUploader = require('./lib/FileUploader.js');

module.exports = Collage;

function Collage () {
    this.uploader = new FileUploader();
}

Collage.prototype = {

    

};

},{"./lib/FileUploader.js":2}],2:[function(require,module,exports){
'use strict';

var UploadTask = require('./UploadTask'),
    util = require('./util.js');

module.exports = FileUploader;

function FileUploader () {

}

FileUploader.prototype = {

    parallel: 3,

    timeoutRetry: 2,

    queue: [],

    processing: [],

    url: null,

    params: null,

    upload: function (file, url, params) {
        url = url ? url : this.url;
        params = params ? params : this.params;

        var task = new UploadTask(url, file, params);

        // callbacks
        task.subscribe('success', this.onsuccess.bind(this));
        task.subscribe('fail', this.onfail.bind(this));
        task.subscribe('timeout', this.ontimeout.bind(this));

        if (this.processing.length >= this.parallel) {
            this.queue.push(task);
        } else {
            this.run(task);
        }

        return task;
    },

    run: function (task) {
        this.processing.push(task);
        task.submit();
    },

    done: function (task) {
        util.remove(this.processing, task);

        // run next task
        if (this.queue.length > 1) {
            var next = this.queue[0];

            this.run(next);
            util.remove(this.queue, next);
        }
    },

    onsuccess: function (task) {
        this.done(task);
    },

    onfail: function (task) {
        this.done(task);
    },

    ontimeout: function (task) {
        if (task.timeouts > this.timeoutRetry) {
            task.onfail();
        } else {
            // submit again
            task.submit();
        }
    }

};

},{"./UploadTask":3,"./util.js":4}],3:[function(require,module,exports){
'use strict';

var util = require('./util.js');

module.exports = UploadTask;

function UploadTask (url, file, params) {
    this.url = url;

    this.data = new FormData();
    this.data.append('file', file);
    if (params instanceof Array) {
        params.forEach(function (input) {
            this.data.append(input.name, input.value);
        });
    }
}

UploadTask.prototype = util.extend({

    timeouts: 0,

    submit: function () {
        var xhr = this.xhr = new XMLHttpRequest();

        // event handlers
        xhr.onprogress = this.onprogress.bind(this);
        xhr.ontimeout = this.ontimeout.bind(this);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    this.onsuccess(xhr);
                } else {
                    this.onfail();
                }
            }
        }.bind(this);

        // send the request
        xhr.timeout = 3000;
        xhr.open('post', this.url);
        xhr.send(this.data);
    },

    onsuccess: function (xhr) {
        this.publish('success', this, xhr.responseText, xhr.status);
    },

    onprogress: function () {
        this.publish('progress', this);
    },

    ontimeout: function () {
        this.timeouts ++;
        this.publish('timeout', this);
    },

    onfail: function () {
        this.publish('fail', this);
    }

}, util.pubsub);

},{"./util.js":4}],4:[function(require,module,exports){
'use strict';

module.exports = {

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
        _observers: {},

        subscribe: function (topic, handler) {
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

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9saWIvRmlsZVVwbG9hZGVyLmpzIiwic3JjL2pzL2xpYi9VcGxvYWRUYXNrLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIEZpbGVVcGxvYWRlciA9IHJlcXVpcmUoJy4vbGliL0ZpbGVVcGxvYWRlci5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxhZ2U7XG5cbmZ1bmN0aW9uIENvbGxhZ2UgKCkge1xuICAgIHRoaXMudXBsb2FkZXIgPSBuZXcgRmlsZVVwbG9hZGVyKCk7XG59XG5cbkNvbGxhZ2UucHJvdG90eXBlID0ge1xuXG4gICAgXG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBVcGxvYWRUYXNrID0gcmVxdWlyZSgnLi9VcGxvYWRUYXNrJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVVcGxvYWRlcjtcblxuZnVuY3Rpb24gRmlsZVVwbG9hZGVyICgpIHtcblxufVxuXG5GaWxlVXBsb2FkZXIucHJvdG90eXBlID0ge1xuXG4gICAgcGFyYWxsZWw6IDMsXG5cbiAgICB0aW1lb3V0UmV0cnk6IDIsXG5cbiAgICBxdWV1ZTogW10sXG5cbiAgICBwcm9jZXNzaW5nOiBbXSxcblxuICAgIHVybDogbnVsbCxcblxuICAgIHBhcmFtczogbnVsbCxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKGZpbGUsIHVybCwgcGFyYW1zKSB7XG4gICAgICAgIHVybCA9IHVybCA/IHVybCA6IHRoaXMudXJsO1xuICAgICAgICBwYXJhbXMgPSBwYXJhbXMgPyBwYXJhbXMgOiB0aGlzLnBhcmFtcztcblxuICAgICAgICB2YXIgdGFzayA9IG5ldyBVcGxvYWRUYXNrKHVybCwgZmlsZSwgcGFyYW1zKTtcblxuICAgICAgICAvLyBjYWxsYmFja3NcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3N1Y2Nlc3MnLCB0aGlzLm9uc3VjY2Vzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ2ZhaWwnLCB0aGlzLm9uZmFpbC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3RpbWVvdXQnLCB0aGlzLm9udGltZW91dC5iaW5kKHRoaXMpKTtcblxuICAgICAgICBpZiAodGhpcy5wcm9jZXNzaW5nLmxlbmd0aCA+PSB0aGlzLnBhcmFsbGVsKSB7XG4gICAgICAgICAgICB0aGlzLnF1ZXVlLnB1c2godGFzayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJ1bih0YXNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXNrO1xuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMucHJvY2Vzc2luZy5wdXNoKHRhc2spO1xuICAgICAgICB0YXNrLnN1Ym1pdCgpO1xuICAgIH0sXG5cbiAgICBkb25lOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB1dGlsLnJlbW92ZSh0aGlzLnByb2Nlc3NpbmcsIHRhc2spO1xuXG4gICAgICAgIC8vIHJ1biBuZXh0IHRhc2tcbiAgICAgICAgaWYgKHRoaXMucXVldWUubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSB0aGlzLnF1ZXVlWzBdO1xuXG4gICAgICAgICAgICB0aGlzLnJ1bihuZXh0KTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlKHRoaXMucXVldWUsIG5leHQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5kb25lKHRhc2spO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMuZG9uZSh0YXNrKTtcbiAgICB9LFxuXG4gICAgb250aW1lb3V0OiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBpZiAodGFzay50aW1lb3V0cyA+IHRoaXMudGltZW91dFJldHJ5KSB7XG4gICAgICAgICAgICB0YXNrLm9uZmFpbCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc3VibWl0IGFnYWluXG4gICAgICAgICAgICB0YXNrLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZFRhc2s7XG5cbmZ1bmN0aW9uIFVwbG9hZFRhc2sgKHVybCwgZmlsZSwgcGFyYW1zKSB7XG4gICAgdGhpcy51cmwgPSB1cmw7XG5cbiAgICB0aGlzLmRhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICB0aGlzLmRhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSk7XG4gICAgaWYgKHBhcmFtcyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5kYXRhLmFwcGVuZChpbnB1dC5uYW1lLCBpbnB1dC52YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuVXBsb2FkVGFzay5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB0aW1lb3V0czogMCxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeGhyID0gdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAvLyBldmVudCBoYW5kbGVyc1xuICAgICAgICB4aHIub25wcm9ncmVzcyA9IHRoaXMub25wcm9ncmVzcy5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIub250aW1lb3V0ID0gdGhpcy5vbnRpbWVvdXQuYmluZCh0aGlzKTtcbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MoeGhyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uZmFpbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8vIHNlbmQgdGhlIHJlcXVlc3RcbiAgICAgICAgeGhyLnRpbWVvdXQgPSAzMDAwO1xuICAgICAgICB4aHIub3BlbigncG9zdCcsIHRoaXMudXJsKTtcbiAgICAgICAgeGhyLnNlbmQodGhpcy5kYXRhKTtcbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAoeGhyKSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgnc3VjY2VzcycsIHRoaXMsIHhoci5yZXNwb25zZVRleHQsIHhoci5zdGF0dXMpO1xuICAgIH0sXG5cbiAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgncHJvZ3Jlc3MnLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgb250aW1lb3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGltZW91dHMgKys7XG4gICAgICAgIHRoaXMucHVibGlzaCgndGltZW91dCcsIHRoaXMpO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdmYWlsJywgdGhpcyk7XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoYXJyYXksIGVsKSB7XG4gICAgICAgIGFycmF5LnNwbGljZShhcnJheS5pbmRleE9mKGVsKSwgMSk7XG4gICAgfSxcblxuICAgIGV4dGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb2JqID0gYXJndW1lbnRzWzBdLFxuICAgICAgICAgICAgc3JjO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzcmMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpKSBvYmpba2V5XSA9IHNyY1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaCAvIFN1YnNjcmliZSBQYXR0ZXJuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBwdWJzdWI6IHtcbiAgICAgICAgX29ic2VydmVyczoge30sXG5cbiAgICAgICAgc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9waWMsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXTtcblxuICAgICAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5zdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBhLnNwbGljZShhLmluZGV4T2YoaGFuZGxlciksIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHB1Ymxpc2g6IGZ1bmN0aW9uICh0b3BpYykge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgICAgICAgICBpZiAoYSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBhW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufTtcbiJdfQ==
