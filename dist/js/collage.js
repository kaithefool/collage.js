(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Collage = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./elements/Img.js":2,"./lib/FileUploader.js":3}],2:[function(require,module,exports){
'use strict';

var util = require('./../lib/util.js');

module.exports = Img;

var defaults = {
    uploader: null,
    url: null,
    params: null
};

function Img (file, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.file = file;
    this.setEl();

    if (this.opts.uploader) {
        this.upload();
    }
}

Img.prototype = {

    setEl: function () {
        this.el = document.createElement('div');

        this.el.innerHTML = '<div class="progress"><div class="progress-bar"></div><div class="progress-text"></div></div>';
        this.bar = this.el.querySelector('.progress-bar');
        this.text = this.el.querySelector('progress-text');
    },

    readFile: function (file) {
        var reader = new FileReader();

        reader.onload = this.onread.bind(this);
        reader.onerr = this.onerr.bind(this);
        reader.readAsDataURL(file);
    },

    onread: function (evt) {
        this.setBg(evt.target.result);
    },

    onerr: function () {

    },

    setBg: function (url) {
        this.el.style = 'background: url(' + url + ')';
    },

    setProgress: function (progress) {
        this.bar.style = 'width: ' + (progress * 100) + '%';
        this.text.innerHTML = (progress * 100) + '%';
    },

    upload: function () {
        var task = this.opts.uploader.upload(this.file, this.opts.url, this.opts.params);

        task.subscribe('success', this.onsuccess);
        task.subscribe('progress', this.onprogress);
        task.subscribe('fail', this.onfail);
    },

    onsuccess: function (task, res) {
        this.setBg(res);
    },

    onprogress: function (task, progress) {
        this.setProgress(progress);
    },

    onfail: function () {
        this.text.innerHTML = 'Upload Failed';
    }

};

},{"./../lib/util.js":5}],3:[function(require,module,exports){
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

},{"./UploadTask":4,"./util.js":5}],4:[function(require,module,exports){
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

    onprogress: function (evt) {
        this.publish('progress', this, evt.loaded / evt.total);
    },

    ontimeout: function () {
        this.timeouts ++;
        this.publish('timeout', this);
    },

    onfail: function () {
        this.publish('fail', this);
    }

}, util.pubsub);

},{"./util.js":5}],5:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIEZpbGVVcGxvYWRlciA9IHJlcXVpcmUoJy4vbGliL0ZpbGVVcGxvYWRlci5qcycpLFxuICAgIEltZyA9IHJlcXVpcmUoJy4vZWxlbWVudHMvSW1nLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGFnZTtcblxudmFyIGRlZmF1bHRzID0ge1xuXG59O1xuXG5mdW5jdGlvbiBDb2xsYWdlICgpIHtcbiAgICB0aGlzLnVwbG9hZGVyID0gbmV3IEZpbGVVcGxvYWRlcigpO1xufVxuXG5Db2xsYWdlLnByb3RvdHlwZSA9IHtcblxuICAgIGltZzogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbWcoZmlsZSwge1xuICAgICAgICAgICAgdXBsb2FkZXI6IHRoaXMudXBsb2FkZXJcbiAgICAgICAgfSk7XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWc7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cGxvYWRlcjogbnVsbCxcbiAgICB1cmw6IG51bGwsXG4gICAgcGFyYW1zOiBudWxsXG59O1xuXG5mdW5jdGlvbiBJbWcgKGZpbGUsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuICAgIHRoaXMuZmlsZSA9IGZpbGU7XG4gICAgdGhpcy5zZXRFbCgpO1xuXG4gICAgaWYgKHRoaXMub3B0cy51cGxvYWRlcikge1xuICAgICAgICB0aGlzLnVwbG9hZCgpO1xuICAgIH1cbn1cblxuSW1nLnByb3RvdHlwZSA9IHtcblxuICAgIHNldEVsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICB0aGlzLmVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3NcIj48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtYmFyXCI+PC9kaXY+PGRpdiBjbGFzcz1cInByb2dyZXNzLXRleHRcIj48L2Rpdj48L2Rpdj4nO1xuICAgICAgICB0aGlzLmJhciA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLnByb2dyZXNzLWJhcicpO1xuICAgICAgICB0aGlzLnRleHQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJ3Byb2dyZXNzLXRleHQnKTtcbiAgICB9LFxuXG4gICAgcmVhZEZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSB0aGlzLm9ucmVhZC5iaW5kKHRoaXMpO1xuICAgICAgICByZWFkZXIub25lcnIgPSB0aGlzLm9uZXJyLmJpbmQodGhpcyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH0sXG5cbiAgICBvbnJlYWQ6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdGhpcy5zZXRCZyhldnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgfSxcblxuICAgIG9uZXJyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgc2V0Qmc6IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdGhpcy5lbC5zdHlsZSA9ICdiYWNrZ3JvdW5kOiB1cmwoJyArIHVybCArICcpJztcbiAgICB9LFxuXG4gICAgc2V0UHJvZ3Jlc3M6IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICB0aGlzLmJhci5zdHlsZSA9ICd3aWR0aDogJyArIChwcm9ncmVzcyAqIDEwMCkgKyAnJSc7XG4gICAgICAgIHRoaXMudGV4dC5pbm5lckhUTUwgPSAocHJvZ3Jlc3MgKiAxMDApICsgJyUnO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRhc2sgPSB0aGlzLm9wdHMudXBsb2FkZXIudXBsb2FkKHRoaXMuZmlsZSwgdGhpcy5vcHRzLnVybCwgdGhpcy5vcHRzLnBhcmFtcyk7XG5cbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3N1Y2Nlc3MnLCB0aGlzLm9uc3VjY2Vzcyk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdwcm9ncmVzcycsIHRoaXMub25wcm9ncmVzcyk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwpO1xuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh0YXNrLCByZXMpIHtcbiAgICAgICAgdGhpcy5zZXRCZyhyZXMpO1xuICAgIH0sXG5cbiAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAodGFzaywgcHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5zZXRQcm9ncmVzcyhwcm9ncmVzcyk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gJ1VwbG9hZCBGYWlsZWQnO1xuICAgIH1cblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFVwbG9hZFRhc2sgPSByZXF1aXJlKCcuL1VwbG9hZFRhc2snKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZVVwbG9hZGVyO1xuXG5mdW5jdGlvbiBGaWxlVXBsb2FkZXIgKCkge1xuXG59XG5cbkZpbGVVcGxvYWRlci5wcm90b3R5cGUgPSB7XG5cbiAgICBwYXJhbGxlbDogMyxcblxuICAgIHRpbWVvdXRSZXRyeTogMixcblxuICAgIHF1ZXVlOiBbXSxcblxuICAgIHByb2Nlc3Npbmc6IFtdLFxuXG4gICAgdXJsOiBudWxsLFxuXG4gICAgcGFyYW1zOiBudWxsLFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbiAoZmlsZSwgdXJsLCBwYXJhbXMpIHtcbiAgICAgICAgdXJsID0gdXJsID8gdXJsIDogdGhpcy51cmw7XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcyA/IHBhcmFtcyA6IHRoaXMucGFyYW1zO1xuXG4gICAgICAgIHZhciB0YXNrID0gbmV3IFVwbG9hZFRhc2sodXJsLCBmaWxlLCBwYXJhbXMpO1xuXG4gICAgICAgIC8vIGNhbGxiYWNrc1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnc3VjY2VzcycsIHRoaXMub25zdWNjZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnZmFpbCcsIHRoaXMub25mYWlsLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgndGltZW91dCcsIHRoaXMub250aW1lb3V0LmJpbmQodGhpcykpO1xuXG4gICAgICAgIGlmICh0aGlzLnByb2Nlc3NpbmcubGVuZ3RoID49IHRoaXMucGFyYWxsZWwpIHtcbiAgICAgICAgICAgIHRoaXMucXVldWUucHVzaCh0YXNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucnVuKHRhc2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhc2s7XG4gICAgfSxcblxuICAgIHJ1bjogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5wcm9jZXNzaW5nLnB1c2godGFzayk7XG4gICAgICAgIHRhc2suc3VibWl0KCk7XG4gICAgfSxcblxuICAgIGRvbmU6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlKHRoaXMucHJvY2Vzc2luZywgdGFzayk7XG5cbiAgICAgICAgLy8gcnVuIG5leHQgdGFza1xuICAgICAgICBpZiAodGhpcy5xdWV1ZS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHRoaXMucXVldWVbMF07XG5cbiAgICAgICAgICAgIHRoaXMucnVuKG5leHQpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmUodGhpcy5xdWV1ZSwgbmV4dCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLmRvbmUodGFzayk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5kb25lKHRhc2spO1xuICAgIH0sXG5cbiAgICBvbnRpbWVvdXQ6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIGlmICh0YXNrLnRpbWVvdXRzID4gdGhpcy50aW1lb3V0UmV0cnkpIHtcbiAgICAgICAgICAgIHRhc2sub25mYWlsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBzdWJtaXQgYWdhaW5cbiAgICAgICAgICAgIHRhc2suc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkVGFzaztcblxuZnVuY3Rpb24gVXBsb2FkVGFzayAodXJsLCBmaWxlLCBwYXJhbXMpIHtcbiAgICB0aGlzLnVybCA9IHVybDtcblxuICAgIHRoaXMuZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIHRoaXMuZGF0YS5hcHBlbmQoJ2ZpbGUnLCBmaWxlKTtcbiAgICBpZiAocGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgcGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB0aGlzLmRhdGEuYXBwZW5kKGlucHV0Lm5hbWUsIGlucHV0LnZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5VcGxvYWRUYXNrLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHRpbWVvdXRzOiAwLFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4aHIgPSB0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgIC8vIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIHhoci5vbnByb2dyZXNzID0gdGhpcy5vbnByb2dyZXNzLmJpbmQodGhpcyk7XG4gICAgICAgIHhoci5vbnRpbWVvdXQgPSB0aGlzLm9udGltZW91dC5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uc3VjY2Vzcyh4aHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25mYWlsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgLy8gc2VuZCB0aGUgcmVxdWVzdFxuICAgICAgICB4aHIudGltZW91dCA9IDMwMDA7XG4gICAgICAgIHhoci5vcGVuKCdwb3N0JywgdGhpcy51cmwpO1xuICAgICAgICB4aHIuc2VuZCh0aGlzLmRhdGEpO1xuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh4aHIpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdzdWNjZXNzJywgdGhpcywgeGhyLnJlc3BvbnNlVGV4dCwgeGhyLnN0YXR1cyk7XG4gICAgfSxcblxuICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdwcm9ncmVzcycsIHRoaXMsIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgIH0sXG5cbiAgICBvbnRpbWVvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0cyArKztcbiAgICAgICAgdGhpcy5wdWJsaXNoKCd0aW1lb3V0JywgdGhpcyk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ2ZhaWwnLCB0aGlzKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgICAgICAgYXJyYXkuc3BsaWNlKGFycmF5LmluZGV4T2YoZWwpLCAxKTtcbiAgICB9LFxuXG4gICAgZXh0ZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBzcmM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNyYyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIG9ialtrZXldID0gc3JjW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoIC8gU3Vic2NyaWJlIFBhdHRlcm5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHB1YnN1Yjoge1xuICAgICAgICBfb2JzZXJ2ZXJzOiB7fSxcblxuICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBpZiAoIShhIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY107XG5cbiAgICAgICAgICAgIGEuc3BsaWNlKGEuaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHVibGlzaDogZnVuY3Rpb24gKHRvcGljKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10sXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIl19
