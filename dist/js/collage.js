(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Collage = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var FileUploader = require('./lib/FileUploader.js'),
    FileDrop = require('./elements/FileDrop.js'),
    Img = require('./elements/Img.js'),
    Sortable = require('./elements/Sortable.js'),
    util = require('./lib/util.js');

module.exports = Collage;

var defaults = {
    uploader: {},
    fileDrop: {},
    sortable: true
};

function Collage (el, opts) {
    this.opts = util.extend({}, defaults, opts);

    this.uploader = new FileUploader(this.opts.uploader);

    if (el) {
        this.list = el.querySelector('.collage-list');

        if (this.opts.fileDrop) {
            this.filedrop = new FileDrop(el, this.opts.fileDrop);
            this.filedrop.subscribe('file', this.onfile.bind(this));
        }

        if (this.opts.sortable) {
            this.sortable = new Sortable(this.list);
        }
    }
}

Collage.prototype = {

    getImg: function (file) {
        return new Img(file, {
            uploader: this.uploader
        });
    },

    onfile: function (file) {
        var img = this.getImg(file);

        this.list.appendChild(img.el);
    }

};

},{"./elements/FileDrop.js":2,"./elements/Img.js":3,"./elements/Sortable.js":4,"./lib/FileUploader.js":5,"./lib/util.js":7}],2:[function(require,module,exports){
'use strict';

var util = require('./../lib/util.js');

module.exports = FileDrop;

var defaults = {
    maxsize: 10,
    format: 'jpe?g|png|gif'
};

function stopEvt (evt) {
    evt.preventDefault();
    evt.stopPropagation();
}

function FileDrop (el, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.el = el;
    this.input = el.querySelector('input[type="file"]');

    // events
    this.el.addEventListener('drop', this.ondrop.bind(this));
    this.el.addEventListener('dragenter', stopEvt);
    this.el.addEventListener('dragover', stopEvt);
    if (this.input) {
        this.input.addEventListener('change', this.ondrop.bind(this));
    }
}

FileDrop.prototype = util.extend({

    validate: function (file) {
        var size = file.size / (1000000) <= this.opts.maxsize,
            format = file.name.match('\.(' + this.opts.format + ')$');

        return size && format;
    },

    ondrag: function () {

    },

    ondrop: function (evt) {
        evt.preventDefault();

        // get files
        var files = evt.currentTarget.files ? evt.currentTarget.files : evt.dataTransfer.files;

        for (var i = 0; i < files.length; i++) {
            // restrict files per drop
            if (i > 20) {
                break;
            }

            var test = this.validate(files[i]);
            if (test) {
                this.publish('file', files[i]);
            } else {

            }
        }
    }

}, util.pubsub);

},{"./../lib/util.js":7}],3:[function(require,module,exports){
'use strict';

var util = require('./../lib/util.js');

module.exports = Img;

var defaults = {
    uploader: null,
    url: null,
    params: null,
    src: null
};

function Img (file, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.file = file;
    this.setEl();
    this.readFile(file);

    if (this.opts.uploader) {
        this.upload();
    }
}

Img.prototype = {

    setEl: function () {
        this.el = document.createElement('div');

        this.el.className = 'collage-img';

        // progress
        this.el.innerHTML = '<div class="collage-progress"><div class="progress-bar"></div><div class="progress-text"></div></div>';
        this.progress = this.el.querySelector('.collage-progress');
        this.bar = this.el.querySelector('.progress-bar');
        this.text = this.el.querySelector('.progress-text');
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
        this.el.style = 'background-image: url(' + url + ')';
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
        this.setBg(res);
        this.progress.parentNode.removeChild(this.progress);
    },

    onprogress: function (task, progress) {
        this.setProgress(progress);
    },

    onfail: function () {
        this.text.innerHTML = 'Upload Failed';
    }

};

},{"./../lib/util.js":7}],4:[function(require,module,exports){
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

},{"./../lib/util.js":7}],5:[function(require,module,exports){
'use strict';

var UploadTask = require('./UploadTask'),
    util = require('./util.js');

module.exports = FileUploader;

var defaults = {
    url: null,
    params: null
};

function FileUploader (opts) {
    this.opts = util.extend({}, defaults, opts);
}

FileUploader.prototype = {

    parallel: 3,

    timeoutRetry: 2,

    queue: [],

    processing: [],

    upload: function (file, url, params) {
        url = url ? url : this.opts.url;
        params = params ? params : this.opts.params;

        var task = new UploadTask(url, this.getFormData(file, params));

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

    getFormData: function (file, params) {
        var data = new FormData();

        data.append('file', file);
        if (params instanceof Array) {
            params.forEach(function (input) {
                data.append(input.name, input.value);
            });
        }

        return data;
    },

    run: function (task) {
        this.processing.push(task);
        task.submit();
    },

    done: function (task) {
        util.remove(this.processing, task);

        // run next task
        if (this.queue.length >= 1) {
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

},{"./UploadTask":6,"./util.js":7}],6:[function(require,module,exports){
'use strict';

var util = require('./util.js');

module.exports = UploadTask;

function UploadTask (url, formData) {
    this.url = url;
    this.formData = formData;
}

UploadTask.prototype = util.extend({

    timeouts: 0,

    submit: function () {
        var xhr = this.xhr = new XMLHttpRequest();

        // event handlers
        xhr.upload.onprogress = this.onprogress.bind(this);
        xhr.ontimeout = this.ontimeout.bind(this);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    this.onsuccess(xhr);
                } else if (xhr.status !== 0) {
                    this.onfail();
                }
            }
        }.bind(this);

        // send the request
        xhr.timeout = (1000 * 60);
        xhr.open('post', this.url);
        xhr.send(this.formData);
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

},{"./util.js":7}],7:[function(require,module,exports){
'use strict';

module.exports = {

    matches: function (el, selector) {
        var p = Element.prototype;
    	var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s) {
    		return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
    	};
    	return f.call(el, selector);
    },

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRmlsZVVwbG9hZGVyID0gcmVxdWlyZSgnLi9saWIvRmlsZVVwbG9hZGVyLmpzJyksXG4gICAgRmlsZURyb3AgPSByZXF1aXJlKCcuL2VsZW1lbnRzL0ZpbGVEcm9wLmpzJyksXG4gICAgSW1nID0gcmVxdWlyZSgnLi9lbGVtZW50cy9JbWcuanMnKSxcbiAgICBTb3J0YWJsZSA9IHJlcXVpcmUoJy4vZWxlbWVudHMvU29ydGFibGUuanMnKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi9saWIvdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxhZ2U7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cGxvYWRlcjoge30sXG4gICAgZmlsZURyb3A6IHt9LFxuICAgIHNvcnRhYmxlOiB0cnVlXG59O1xuXG5mdW5jdGlvbiBDb2xsYWdlIChlbCwgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG5cbiAgICB0aGlzLnVwbG9hZGVyID0gbmV3IEZpbGVVcGxvYWRlcih0aGlzLm9wdHMudXBsb2FkZXIpO1xuXG4gICAgaWYgKGVsKSB7XG4gICAgICAgIHRoaXMubGlzdCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYWdlLWxpc3QnKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRzLmZpbGVEcm9wKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVkcm9wID0gbmV3IEZpbGVEcm9wKGVsLCB0aGlzLm9wdHMuZmlsZURyb3ApO1xuICAgICAgICAgICAgdGhpcy5maWxlZHJvcC5zdWJzY3JpYmUoJ2ZpbGUnLCB0aGlzLm9uZmlsZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdHMuc29ydGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuc29ydGFibGUgPSBuZXcgU29ydGFibGUodGhpcy5saXN0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQ29sbGFnZS5wcm90b3R5cGUgPSB7XG5cbiAgICBnZXRJbWc6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW1nKGZpbGUsIHtcbiAgICAgICAgICAgIHVwbG9hZGVyOiB0aGlzLnVwbG9hZGVyXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbmZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHZhciBpbWcgPSB0aGlzLmdldEltZyhmaWxlKTtcblxuICAgICAgICB0aGlzLmxpc3QuYXBwZW5kQ2hpbGQoaW1nLmVsKTtcbiAgICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVEcm9wO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgbWF4c2l6ZTogMTAsXG4gICAgZm9ybWF0OiAnanBlP2d8cG5nfGdpZidcbn07XG5cbmZ1bmN0aW9uIHN0b3BFdnQgKGV2dCkge1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbn1cblxuZnVuY3Rpb24gRmlsZURyb3AgKGVsLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbiAgICB0aGlzLmVsID0gZWw7XG4gICAgdGhpcy5pbnB1dCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJmaWxlXCJdJyk7XG5cbiAgICAvLyBldmVudHNcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCB0aGlzLm9uZHJvcC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbnRlcicsIHN0b3BFdnQpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCBzdG9wRXZ0KTtcbiAgICBpZiAodGhpcy5pbnB1dCkge1xuICAgICAgICB0aGlzLmlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMub25kcm9wLmJpbmQodGhpcykpO1xuICAgIH1cbn1cblxuRmlsZURyb3AucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdmFsaWRhdGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHZhciBzaXplID0gZmlsZS5zaXplIC8gKDEwMDAwMDApIDw9IHRoaXMub3B0cy5tYXhzaXplLFxuICAgICAgICAgICAgZm9ybWF0ID0gZmlsZS5uYW1lLm1hdGNoKCdcXC4oJyArIHRoaXMub3B0cy5mb3JtYXQgKyAnKSQnKTtcblxuICAgICAgICByZXR1cm4gc2l6ZSAmJiBmb3JtYXQ7XG4gICAgfSxcblxuICAgIG9uZHJhZzogZnVuY3Rpb24gKCkge1xuXG4gICAgfSxcblxuICAgIG9uZHJvcDogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAvLyBnZXQgZmlsZXNcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LmN1cnJlbnRUYXJnZXQuZmlsZXMgPyBldnQuY3VycmVudFRhcmdldC5maWxlcyA6IGV2dC5kYXRhVHJhbnNmZXIuZmlsZXM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgLy8gcmVzdHJpY3QgZmlsZXMgcGVyIGRyb3BcbiAgICAgICAgICAgIGlmIChpID4gMjApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHRlc3QgPSB0aGlzLnZhbGlkYXRlKGZpbGVzW2ldKTtcbiAgICAgICAgICAgIGlmICh0ZXN0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJsaXNoKCdmaWxlJywgZmlsZXNbaV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltZztcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIHVybDogbnVsbCxcbiAgICBwYXJhbXM6IG51bGwsXG4gICAgc3JjOiBudWxsXG59O1xuXG5mdW5jdGlvbiBJbWcgKGZpbGUsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuICAgIHRoaXMuZmlsZSA9IGZpbGU7XG4gICAgdGhpcy5zZXRFbCgpO1xuICAgIHRoaXMucmVhZEZpbGUoZmlsZSk7XG5cbiAgICBpZiAodGhpcy5vcHRzLnVwbG9hZGVyKSB7XG4gICAgICAgIHRoaXMudXBsb2FkKCk7XG4gICAgfVxufVxuXG5JbWcucHJvdG90eXBlID0ge1xuXG4gICAgc2V0RWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIHRoaXMuZWwuY2xhc3NOYW1lID0gJ2NvbGxhZ2UtaW1nJztcblxuICAgICAgICAvLyBwcm9ncmVzc1xuICAgICAgICB0aGlzLmVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwiY29sbGFnZS1wcm9ncmVzc1wiPjxkaXYgY2xhc3M9XCJwcm9ncmVzcy1iYXJcIj48L2Rpdj48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtdGV4dFwiPjwvZGl2PjwvZGl2Pic7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYWdlLXByb2dyZXNzJyk7XG4gICAgICAgIHRoaXMuYmFyID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcucHJvZ3Jlc3MtYmFyJyk7XG4gICAgICAgIHRoaXMudGV4dCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLnByb2dyZXNzLXRleHQnKTtcbiAgICB9LFxuXG4gICAgcmVhZEZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSB0aGlzLm9ucmVhZC5iaW5kKHRoaXMpO1xuICAgICAgICByZWFkZXIub25lcnIgPSB0aGlzLm9uZXJyLmJpbmQodGhpcyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH0sXG5cbiAgICBvbnJlYWQ6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdGhpcy5zZXRCZyhldnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgfSxcblxuICAgIG9uZXJyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgc2V0Qmc6IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgdGhpcy5lbC5zdHlsZSA9ICdiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArIHVybCArICcpJztcbiAgICB9LFxuXG4gICAgc2V0UHJvZ3Jlc3M6IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBwcm9ncmVzcyA9IE1hdGgucm91bmQocHJvZ3Jlc3MgKiAxMDApO1xuICAgICAgICB0aGlzLmJhci5zdHlsZSA9ICd3aWR0aDogJyArIHByb2dyZXNzICsgJyUnO1xuICAgICAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gcHJvZ3Jlc3MgKyAnJSc7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGFzayA9IHRoaXMub3B0cy51cGxvYWRlci51cGxvYWQodGhpcy5maWxlLCB0aGlzLm9wdHMudXJsLCB0aGlzLm9wdHMucGFyYW1zKTtcblxuICAgICAgICB0YXNrLnN1YnNjcmliZSgnc3VjY2VzcycsIHRoaXMub25zdWNjZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgncHJvZ3Jlc3MnLCB0aGlzLm9ucHJvZ3Jlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHRhc2ssIHJlcykge1xuICAgICAgICB0aGlzLnNldEJnKHJlcyk7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnByb2dyZXNzKTtcbiAgICB9LFxuXG4gICAgb25wcm9ncmVzczogZnVuY3Rpb24gKHRhc2ssIHByb2dyZXNzKSB7XG4gICAgICAgIHRoaXMuc2V0UHJvZ3Jlc3MocHJvZ3Jlc3MpO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50ZXh0LmlubmVySFRNTCA9ICdVcGxvYWQgRmFpbGVkJztcbiAgICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvcnRhYmxlO1xuXG5mdW5jdGlvbiBTb3J0YWJsZSAoZWwsIHNlbGVjdG9yKSB7XG4gICAgdGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yID8gc2VsZWN0b3IgOiAnLmNvbGxhZ2UtaW1nJztcblxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25tb3VzZWRvd24uYmluZCh0aGlzKSk7XG59XG5cblNvcnRhYmxlLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIG9ubW91c2Vkb3duOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGlmICh1dGlsLm1hdGNoZXMoZXZ0LnRhcmdldCwgdGhpcy5zZWxlY3RvcikpIHtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9ubW91c2VvdmVyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgb25tb3VzZXVwOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgb246IGZ1bmN0aW9uICgpIHt9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFVwbG9hZFRhc2sgPSByZXF1aXJlKCcuL1VwbG9hZFRhc2snKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZVVwbG9hZGVyO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgdXJsOiBudWxsLFxuICAgIHBhcmFtczogbnVsbFxufTtcblxuZnVuY3Rpb24gRmlsZVVwbG9hZGVyIChvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbn1cblxuRmlsZVVwbG9hZGVyLnByb3RvdHlwZSA9IHtcblxuICAgIHBhcmFsbGVsOiAzLFxuXG4gICAgdGltZW91dFJldHJ5OiAyLFxuXG4gICAgcXVldWU6IFtdLFxuXG4gICAgcHJvY2Vzc2luZzogW10sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uIChmaWxlLCB1cmwsIHBhcmFtcykge1xuICAgICAgICB1cmwgPSB1cmwgPyB1cmwgOiB0aGlzLm9wdHMudXJsO1xuICAgICAgICBwYXJhbXMgPSBwYXJhbXMgPyBwYXJhbXMgOiB0aGlzLm9wdHMucGFyYW1zO1xuXG4gICAgICAgIHZhciB0YXNrID0gbmV3IFVwbG9hZFRhc2sodXJsLCB0aGlzLmdldEZvcm1EYXRhKGZpbGUsIHBhcmFtcykpO1xuXG4gICAgICAgIC8vIGNhbGxiYWNrc1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnc3VjY2VzcycsIHRoaXMub25zdWNjZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnZmFpbCcsIHRoaXMub25mYWlsLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgndGltZW91dCcsIHRoaXMub250aW1lb3V0LmJpbmQodGhpcykpO1xuXG4gICAgICAgIGlmICh0aGlzLnByb2Nlc3NpbmcubGVuZ3RoID49IHRoaXMucGFyYWxsZWwpIHtcbiAgICAgICAgICAgIHRoaXMucXVldWUucHVzaCh0YXNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucnVuKHRhc2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhc2s7XG4gICAgfSxcblxuICAgIGdldEZvcm1EYXRhOiBmdW5jdGlvbiAoZmlsZSwgcGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cbiAgICAgICAgZGF0YS5hcHBlbmQoJ2ZpbGUnLCBmaWxlKTtcbiAgICAgICAgaWYgKHBhcmFtcyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBwYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBkYXRhLmFwcGVuZChpbnB1dC5uYW1lLCBpbnB1dC52YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMucHJvY2Vzc2luZy5wdXNoKHRhc2spO1xuICAgICAgICB0YXNrLnN1Ym1pdCgpO1xuICAgIH0sXG5cbiAgICBkb25lOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB1dGlsLnJlbW92ZSh0aGlzLnByb2Nlc3NpbmcsIHRhc2spO1xuXG4gICAgICAgIC8vIHJ1biBuZXh0IHRhc2tcbiAgICAgICAgaWYgKHRoaXMucXVldWUubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gdGhpcy5xdWV1ZVswXTtcblxuICAgICAgICAgICAgdGhpcy5ydW4obmV4dCk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZSh0aGlzLnF1ZXVlLCBuZXh0KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMuZG9uZSh0YXNrKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLmRvbmUodGFzayk7XG4gICAgfSxcblxuICAgIG9udGltZW91dDogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgaWYgKHRhc2sudGltZW91dHMgPiB0aGlzLnRpbWVvdXRSZXRyeSkge1xuICAgICAgICAgICAgdGFzay5vbmZhaWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHN1Ym1pdCBhZ2FpblxuICAgICAgICAgICAgdGFzay5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRUYXNrO1xuXG5mdW5jdGlvbiBVcGxvYWRUYXNrICh1cmwsIGZvcm1EYXRhKSB7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy5mb3JtRGF0YSA9IGZvcm1EYXRhO1xufVxuXG5VcGxvYWRUYXNrLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHRpbWVvdXRzOiAwLFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4aHIgPSB0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgIC8vIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IHRoaXMub25wcm9ncmVzcy5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIub250aW1lb3V0ID0gdGhpcy5vbnRpbWVvdXQuYmluZCh0aGlzKTtcbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MoeGhyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHhoci5zdGF0dXMgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmZhaWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAvLyBzZW5kIHRoZSByZXF1ZXN0XG4gICAgICAgIHhoci50aW1lb3V0ID0gKDEwMDAgKiA2MCk7XG4gICAgICAgIHhoci5vcGVuKCdwb3N0JywgdGhpcy51cmwpO1xuICAgICAgICB4aHIuc2VuZCh0aGlzLmZvcm1EYXRhKTtcbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAoeGhyKSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgnc3VjY2VzcycsIHRoaXMsIHhoci5yZXNwb25zZVRleHQsIHhoci5zdGF0dXMpO1xuICAgIH0sXG5cbiAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgncHJvZ3Jlc3MnLCB0aGlzLCBldnQubG9hZGVkIC8gZXZ0LnRvdGFsKTtcbiAgICB9LFxuXG4gICAgb250aW1lb3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGltZW91dHMgKys7XG4gICAgICAgIHRoaXMucHVibGlzaCgndGltZW91dCcsIHRoaXMpO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdmYWlsJywgdGhpcyk7XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgbWF0Y2hlczogZnVuY3Rpb24gKGVsLCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgcCA9IEVsZW1lbnQucHJvdG90eXBlO1xuICAgIFx0dmFyIGYgPSBwLm1hdGNoZXMgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBmdW5jdGlvbihzKSB7XG4gICAgXHRcdHJldHVybiBbXS5pbmRleE9mLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzKSwgdGhpcykgIT09IC0xO1xuICAgIFx0fTtcbiAgICBcdHJldHVybiBmLmNhbGwoZWwsIHNlbGVjdG9yKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoYXJyYXksIGVsKSB7XG4gICAgICAgIGFycmF5LnNwbGljZShhcnJheS5pbmRleE9mKGVsKSwgMSk7XG4gICAgfSxcblxuICAgIGV4dGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb2JqID0gYXJndW1lbnRzWzBdLFxuICAgICAgICAgICAgc3JjO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzcmMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpKSBvYmpba2V5XSA9IHNyY1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaCAvIFN1YnNjcmliZSBQYXR0ZXJuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBwdWJzdWI6IHtcbiAgICAgICAgc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9waWMsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fb2JzZXJ2ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzID0ge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXTtcblxuICAgICAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5zdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBhLnNwbGljZShhLmluZGV4T2YoaGFuZGxlciksIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHB1Ymxpc2g6IGZ1bmN0aW9uICh0b3BpYykge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgICAgICAgICBpZiAoYSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBhW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufTtcbiJdfQ==
