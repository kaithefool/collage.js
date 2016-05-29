(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Collage = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var FileUploader = require('./lib/FileUploader.js'),
    FileDrop = require('./elements/FileDrop.js'),
    Img = require('./elements/Img.js'),
    Sortable = require('./elements/Sortable.js'),
    util = require('./lib/util.js');

module.exports = Collage;

var defaults = {
    uploader: null,
    fileDrop: {},
    sortable: true
};

function Collage (el, opts) {
    this.opts = util.extend({}, defaults, opts);

    // setup uploader
    if (this.opts.uploader) {
        this.uploader = new FileUploader(this.opts.uploader);
    }

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

Collage.prototype = util.extend({

    uploader: null,

    add: function (items) {
        if (Array.isArray(items)) {
            items.forEach(function (item) {
                this._add(item);
            }.bind(this));
        }
    },

    _add: function (item) {
        var img = this.getImg(item);

        this.list.appendChild(img.el);

        // sortable
        if (this.sortable) {
            this.sortable.add(img.el);
        }
    },

    getImg: function (src) {
        return new Img(src, {
            uploader: this.uploader
        });
    },

    onfile: function (file) {
        this._add(file);
    }

}, util.pubsub);

},{"./elements/FileDrop.js":2,"./elements/Img.js":3,"./elements/Sortable.js":4,"./lib/FileUploader.js":5,"./lib/util.js":8}],2:[function(require,module,exports){
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
                this.publish('invalid', files[i]);
            }
        }
    }

}, util.pubsub);

},{"./../lib/util.js":8}],3:[function(require,module,exports){
'use strict';

var util = require('./../lib/util.js'),
    resize = require('./../lib/resize.js');

module.exports = Img;

var defaults = {
    uploader: null,
    url: null,
    params: null
};

function Img (src, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.setEl();

    if (src instanceof File) {
        // if file is provided as source
        this.file = src;
        this.setEl(this.opts.uploader);
        this.readFile(src);

        // upload file
        if (this.opts.uploader) {
            this.upload();
        }
    } else {
        // url as source
        this.setEl();
        this.setBg(src);
    }
}

Img.prototype = {

    setEl: function (progress) {
        this.el = document.createElement('div');

        this.el.className = 'collage-img';

        // progress
        if (progress) {
            this.el.innerHTML = '<div class="collage-progress"><div class="progress-bar"></div><div class="progress-text"></div></div>';
            this.progress = this.el.querySelector('.collage-progress');
            this.bar = this.el.querySelector('.progress-bar');
            this.text = this.el.querySelector('.progress-text');
        }
    },

    readFile: function (file) {
        var reader = new FileReader();

        reader.onload = this.onread.bind(this);
        reader.onerr = this.onerr.bind(this);
        reader.readAsDataURL(file);
    },

    onread: function (evt) {
        var src = resize(evt.target.result, 500, 500);

        this.setBg(src);
    },

    onerr: function () {

    },

    setBg: function (src) {
        this.el.style = 'background-image: url(' + src + ')';
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

},{"./../lib/resize.js":7,"./../lib/util.js":8}],4:[function(require,module,exports){
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
    this.selector = selector ? selector : '[draggable]';

    util.on(el, 'dragstart', this.selector, this.ondragstart.bind(this));
    util.on(el, 'dragover', this.selector, this.ondragover.bind(this));

    el.className += 'collage-sortable';
}

Sortable.prototype = util.extend({

    target: null,

    add: function (el) {
        el.draggable = true;
    },

    ondragstart: function (evt) {
        this.target = evt.target;
    },

    ondragover: function (evt) {
        if (evt.target !== this.target) {
            swap(evt.target, this.target);
        }
    },

    ondrop: function () {
        this.target = null;
    },

    swap: function (el0, el1) {

    },

    on: function () {}

}, util.pubsub);

},{"./../lib/util.js":8}],5:[function(require,module,exports){
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

},{"./UploadTask":6,"./util.js":8}],6:[function(require,module,exports){
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

},{"./util.js":8}],7:[function(require,module,exports){
'use strict';

function resize (src, width, height) {
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        img = new Image();

    img.src = src;
    var dimension = scale(img, {width: width, height: height});
    canvas.width = dimension.width;
    canvas.height = dimension.height;
    ctx.drawImage(img, 0, 0, dimension.width, dimension.height);

    return canvas.toDataURL('image/jpeg');
}

function scale (img, max) {
    var imgAR = img.height / img.width,
        maxAR,
        scaleWithWidth = false;

    if (!max.height) {
        scaleWithWidth = true;
    }
    if (max.width && max.height) {
        maxAR = max.height / max.width;
        if (maxAR > imgAR) {
            scaleWithWidth = true;
        }
    }

    if (scaleWithWidth) {
        return {
            width: max.width,
            height: max.width * imgAR
        };
    } else {
        return {
            width: max.height / imgAR,
            height: max.height
        };
    }
}

module.exports = resize;

},{}],8:[function(require,module,exports){
'use strict';

module.exports = {

    /**
     * Check if element would be selected by the specified selector string
     * @param  {[type]} el       [description]
     * @param  {[type]} selector [description]
     * @return {[type]}          [description]
     */
    matches: function (el, selector) {
        var p = Element.prototype;
    	var f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(s) {
    		return [].indexOf.call(document.querySelectorAll(s), this) !== -1;
    	};
    	return f.call(el, selector);
    },

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvcmVzaXplLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIEZpbGVVcGxvYWRlciA9IHJlcXVpcmUoJy4vbGliL0ZpbGVVcGxvYWRlci5qcycpLFxuICAgIEZpbGVEcm9wID0gcmVxdWlyZSgnLi9lbGVtZW50cy9GaWxlRHJvcC5qcycpLFxuICAgIEltZyA9IHJlcXVpcmUoJy4vZWxlbWVudHMvSW1nLmpzJyksXG4gICAgU29ydGFibGUgPSByZXF1aXJlKCcuL2VsZW1lbnRzL1NvcnRhYmxlLmpzJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsYWdlO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgdXBsb2FkZXI6IG51bGwsXG4gICAgZmlsZURyb3A6IHt9LFxuICAgIHNvcnRhYmxlOiB0cnVlXG59O1xuXG5mdW5jdGlvbiBDb2xsYWdlIChlbCwgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG5cbiAgICAvLyBzZXR1cCB1cGxvYWRlclxuICAgIGlmICh0aGlzLm9wdHMudXBsb2FkZXIpIHtcbiAgICAgICAgdGhpcy51cGxvYWRlciA9IG5ldyBGaWxlVXBsb2FkZXIodGhpcy5vcHRzLnVwbG9hZGVyKTtcbiAgICB9XG5cbiAgICBpZiAoZWwpIHtcbiAgICAgICAgdGhpcy5saXN0ID0gZWwucXVlcnlTZWxlY3RvcignLmNvbGxhZ2UtbGlzdCcpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdHMuZmlsZURyb3ApIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZWRyb3AgPSBuZXcgRmlsZURyb3AoZWwsIHRoaXMub3B0cy5maWxlRHJvcCk7XG4gICAgICAgICAgICB0aGlzLmZpbGVkcm9wLnN1YnNjcmliZSgnZmlsZScsIHRoaXMub25maWxlLmJpbmQodGhpcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0cy5zb3J0YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5zb3J0YWJsZSA9IG5ldyBTb3J0YWJsZSh0aGlzLmxpc3QpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5Db2xsYWdlLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHVwbG9hZGVyOiBudWxsLFxuXG4gICAgYWRkOiBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbXMpKSB7XG4gICAgICAgICAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkKGl0ZW0pO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfYWRkOiBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICB2YXIgaW1nID0gdGhpcy5nZXRJbWcoaXRlbSk7XG5cbiAgICAgICAgdGhpcy5saXN0LmFwcGVuZENoaWxkKGltZy5lbCk7XG5cbiAgICAgICAgLy8gc29ydGFibGVcbiAgICAgICAgaWYgKHRoaXMuc29ydGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuc29ydGFibGUuYWRkKGltZy5lbCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0SW1nOiBmdW5jdGlvbiAoc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW1nKHNyYywge1xuICAgICAgICAgICAgdXBsb2FkZXI6IHRoaXMudXBsb2FkZXJcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG9uZmlsZTogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgdGhpcy5fYWRkKGZpbGUpO1xuICAgIH1cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlRHJvcDtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIG1heHNpemU6IDEwLFxuICAgIGZvcm1hdDogJ2pwZT9nfHBuZ3xnaWYnXG59O1xuXG5mdW5jdGlvbiBzdG9wRXZ0IChldnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5cbmZ1bmN0aW9uIEZpbGVEcm9wIChlbCwgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG4gICAgdGhpcy5lbCA9IGVsO1xuICAgIHRoaXMuaW5wdXQgPSBlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xuXG4gICAgLy8gZXZlbnRzXG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5vbmRyb3AuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBzdG9wRXZ0KTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgc3RvcEV2dCk7XG4gICAgaWYgKHRoaXMuaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLm9uZHJvcC5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbkZpbGVEcm9wLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZSAvICgxMDAwMDAwKSA8PSB0aGlzLm9wdHMubWF4c2l6ZSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGZpbGUubmFtZS5tYXRjaCgnXFwuKCcgKyB0aGlzLm9wdHMuZm9ybWF0ICsgJykkJyk7XG5cbiAgICAgICAgcmV0dXJuIHNpemUgJiYgZm9ybWF0O1xuICAgIH0sXG5cbiAgICBvbmRyYWc6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBvbmRyb3A6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gZ2V0IGZpbGVzXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzID8gZXZ0LmN1cnJlbnRUYXJnZXQuZmlsZXMgOiBldnQuZGF0YVRyYW5zZmVyLmZpbGVzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIHJlc3RyaWN0IGZpbGVzIHBlciBkcm9wXG4gICAgICAgICAgICBpZiAoaSA+IDIwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB0ZXN0ID0gdGhpcy52YWxpZGF0ZShmaWxlc1tpXSk7XG4gICAgICAgICAgICBpZiAodGVzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaCgnZmlsZScsIGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJsaXNoKCdpbnZhbGlkJywgZmlsZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpLFxuICAgIHJlc2l6ZSA9IHJlcXVpcmUoJy4vLi4vbGliL3Jlc2l6ZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltZztcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIHVybDogbnVsbCxcbiAgICBwYXJhbXM6IG51bGxcbn07XG5cbmZ1bmN0aW9uIEltZyAoc3JjLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbiAgICB0aGlzLnNldEVsKCk7XG5cbiAgICBpZiAoc3JjIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAvLyBpZiBmaWxlIGlzIHByb3ZpZGVkIGFzIHNvdXJjZVxuICAgICAgICB0aGlzLmZpbGUgPSBzcmM7XG4gICAgICAgIHRoaXMuc2V0RWwodGhpcy5vcHRzLnVwbG9hZGVyKTtcbiAgICAgICAgdGhpcy5yZWFkRmlsZShzcmMpO1xuXG4gICAgICAgIC8vIHVwbG9hZCBmaWxlXG4gICAgICAgIGlmICh0aGlzLm9wdHMudXBsb2FkZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXBsb2FkKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1cmwgYXMgc291cmNlXG4gICAgICAgIHRoaXMuc2V0RWwoKTtcbiAgICAgICAgdGhpcy5zZXRCZyhzcmMpO1xuICAgIH1cbn1cblxuSW1nLnByb3RvdHlwZSA9IHtcblxuICAgIHNldEVsOiBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIHRoaXMuZWwuY2xhc3NOYW1lID0gJ2NvbGxhZ2UtaW1nJztcblxuICAgICAgICAvLyBwcm9ncmVzc1xuICAgICAgICBpZiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJjb2xsYWdlLXByb2dyZXNzXCI+PGRpdiBjbGFzcz1cInByb2dyZXNzLWJhclwiPjwvZGl2PjxkaXYgY2xhc3M9XCJwcm9ncmVzcy10ZXh0XCI+PC9kaXY+PC9kaXY+JztcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYWdlLXByb2dyZXNzJyk7XG4gICAgICAgICAgICB0aGlzLmJhciA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLnByb2dyZXNzLWJhcicpO1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcucHJvZ3Jlc3MtdGV4dCcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlYWRGaWxlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgICByZWFkZXIub25sb2FkID0gdGhpcy5vbnJlYWQuYmluZCh0aGlzKTtcbiAgICAgICAgcmVhZGVyLm9uZXJyID0gdGhpcy5vbmVyci5iaW5kKHRoaXMpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICB9LFxuXG4gICAgb25yZWFkOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHZhciBzcmMgPSByZXNpemUoZXZ0LnRhcmdldC5yZXN1bHQsIDUwMCwgNTAwKTtcblxuICAgICAgICB0aGlzLnNldEJnKHNyYyk7XG4gICAgfSxcblxuICAgIG9uZXJyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgc2V0Qmc6IGZ1bmN0aW9uIChzcmMpIHtcbiAgICAgICAgdGhpcy5lbC5zdHlsZSA9ICdiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArIHNyYyArICcpJztcbiAgICB9LFxuXG4gICAgc2V0UHJvZ3Jlc3M6IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBwcm9ncmVzcyA9IE1hdGgucm91bmQocHJvZ3Jlc3MgKiAxMDApO1xuICAgICAgICB0aGlzLmJhci5zdHlsZSA9ICd3aWR0aDogJyArIHByb2dyZXNzICsgJyUnO1xuICAgICAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gcHJvZ3Jlc3MgKyAnJSc7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGFzayA9IHRoaXMub3B0cy51cGxvYWRlci51cGxvYWQodGhpcy5maWxlLCB0aGlzLm9wdHMudXJsLCB0aGlzLm9wdHMucGFyYW1zKTtcblxuICAgICAgICB0YXNrLnN1YnNjcmliZSgnc3VjY2VzcycsIHRoaXMub25zdWNjZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgncHJvZ3Jlc3MnLCB0aGlzLm9ucHJvZ3Jlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHRhc2ssIHJlcykge1xuICAgICAgICB0aGlzLnNldEJnKHJlcyk7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnByb2dyZXNzKTtcbiAgICB9LFxuXG4gICAgb25wcm9ncmVzczogZnVuY3Rpb24gKHRhc2ssIHByb2dyZXNzKSB7XG4gICAgICAgIHRoaXMuc2V0UHJvZ3Jlc3MocHJvZ3Jlc3MpO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50ZXh0LmlubmVySFRNTCA9ICdVcGxvYWQgRmFpbGVkJztcbiAgICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvcnRhYmxlO1xuXG5mdW5jdGlvbiBzd2FwIChlbDAsIGVsMSkge1xuICAgIHZhciBlbDBOZXh0ID0gZWwwLm5leHRTaWJsaW5nLFxuICAgICAgICBlbDFOZXh0ID0gZWwxLm5leHRTaWJsaW5nO1xuXG4gICAgZWwwLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsMCwgZWwxTmV4dCk7XG4gICAgZWwxLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsMSwgZWwwTmV4dCk7XG59XG5cbmZ1bmN0aW9uIFNvcnRhYmxlIChlbCwgc2VsZWN0b3IpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3IgPyBzZWxlY3RvciA6ICdbZHJhZ2dhYmxlXSc7XG5cbiAgICB1dGlsLm9uKGVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5zZWxlY3RvciwgdGhpcy5vbmRyYWdzdGFydC5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKGVsLCAnZHJhZ292ZXInLCB0aGlzLnNlbGVjdG9yLCB0aGlzLm9uZHJhZ292ZXIuYmluZCh0aGlzKSk7XG5cbiAgICBlbC5jbGFzc05hbWUgKz0gJ2NvbGxhZ2Utc29ydGFibGUnO1xufVxuXG5Tb3J0YWJsZS5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB0YXJnZXQ6IG51bGwsXG5cbiAgICBhZGQ6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5kcmFnZ2FibGUgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBvbmRyYWdzdGFydDogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGV2dC50YXJnZXQ7XG4gICAgfSxcblxuICAgIG9uZHJhZ292ZXI6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgaWYgKGV2dC50YXJnZXQgIT09IHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICBzd2FwKGV2dC50YXJnZXQsIHRoaXMudGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbmRyb3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBudWxsO1xuICAgIH0sXG5cbiAgICBzd2FwOiBmdW5jdGlvbiAoZWwwLCBlbDEpIHtcblxuICAgIH0sXG5cbiAgICBvbjogZnVuY3Rpb24gKCkge31cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVXBsb2FkVGFzayA9IHJlcXVpcmUoJy4vVXBsb2FkVGFzaycpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlVXBsb2FkZXI7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cmw6IG51bGwsXG4gICAgcGFyYW1zOiBudWxsXG59O1xuXG5mdW5jdGlvbiBGaWxlVXBsb2FkZXIgKG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xufVxuXG5GaWxlVXBsb2FkZXIucHJvdG90eXBlID0ge1xuXG4gICAgcGFyYWxsZWw6IDMsXG5cbiAgICB0aW1lb3V0UmV0cnk6IDIsXG5cbiAgICBxdWV1ZTogW10sXG5cbiAgICBwcm9jZXNzaW5nOiBbXSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKGZpbGUsIHVybCwgcGFyYW1zKSB7XG4gICAgICAgIHVybCA9IHVybCA/IHVybCA6IHRoaXMub3B0cy51cmw7XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcyA/IHBhcmFtcyA6IHRoaXMub3B0cy5wYXJhbXM7XG5cbiAgICAgICAgdmFyIHRhc2sgPSBuZXcgVXBsb2FkVGFzayh1cmwsIHRoaXMuZ2V0Rm9ybURhdGEoZmlsZSwgcGFyYW1zKSk7XG5cbiAgICAgICAgLy8gY2FsbGJhY2tzXG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdzdWNjZXNzJywgdGhpcy5vbnN1Y2Nlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCd0aW1lb3V0JywgdGhpcy5vbnRpbWVvdXQuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvY2Vzc2luZy5sZW5ndGggPj0gdGhpcy5wYXJhbGxlbCkge1xuICAgICAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKHRhc2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ydW4odGFzayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFzaztcbiAgICB9LFxuXG4gICAgZ2V0Rm9ybURhdGE6IGZ1bmN0aW9uIChmaWxlLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEoKTtcblxuICAgICAgICBkYXRhLmFwcGVuZCgnZmlsZScsIGZpbGUpO1xuICAgICAgICBpZiAocGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgICAgIGRhdGEuYXBwZW5kKGlucHV0Lm5hbWUsIGlucHV0LnZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIHJ1bjogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5wcm9jZXNzaW5nLnB1c2godGFzayk7XG4gICAgICAgIHRhc2suc3VibWl0KCk7XG4gICAgfSxcblxuICAgIGRvbmU6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlKHRoaXMucHJvY2Vzc2luZywgdGFzayk7XG5cbiAgICAgICAgLy8gcnVuIG5leHQgdGFza1xuICAgICAgICBpZiAodGhpcy5xdWV1ZS5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSB0aGlzLnF1ZXVlWzBdO1xuXG4gICAgICAgICAgICB0aGlzLnJ1bihuZXh0KTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlKHRoaXMucXVldWUsIG5leHQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5kb25lKHRhc2spO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMuZG9uZSh0YXNrKTtcbiAgICB9LFxuXG4gICAgb250aW1lb3V0OiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBpZiAodGFzay50aW1lb3V0cyA+IHRoaXMudGltZW91dFJldHJ5KSB7XG4gICAgICAgICAgICB0YXNrLm9uZmFpbCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc3VibWl0IGFnYWluXG4gICAgICAgICAgICB0YXNrLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZFRhc2s7XG5cbmZ1bmN0aW9uIFVwbG9hZFRhc2sgKHVybCwgZm9ybURhdGEpIHtcbiAgICB0aGlzLnVybCA9IHVybDtcbiAgICB0aGlzLmZvcm1EYXRhID0gZm9ybURhdGE7XG59XG5cblVwbG9hZFRhc2sucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdGltZW91dHM6IDAsXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHhociA9IHRoaXMueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgLy8gZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gdGhpcy5vbnByb2dyZXNzLmJpbmQodGhpcyk7XG4gICAgICAgIHhoci5vbnRpbWVvdXQgPSB0aGlzLm9udGltZW91dC5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uc3VjY2Vzcyh4aHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeGhyLnN0YXR1cyAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uZmFpbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8vIHNlbmQgdGhlIHJlcXVlc3RcbiAgICAgICAgeGhyLnRpbWVvdXQgPSAoMTAwMCAqIDYwKTtcbiAgICAgICAgeGhyLm9wZW4oJ3Bvc3QnLCB0aGlzLnVybCk7XG4gICAgICAgIHhoci5zZW5kKHRoaXMuZm9ybURhdGEpO1xuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh4aHIpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdzdWNjZXNzJywgdGhpcywgeGhyLnJlc3BvbnNlVGV4dCwgeGhyLnN0YXR1cyk7XG4gICAgfSxcblxuICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdwcm9ncmVzcycsIHRoaXMsIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgIH0sXG5cbiAgICBvbnRpbWVvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0cyArKztcbiAgICAgICAgdGhpcy5wdWJsaXNoKCd0aW1lb3V0JywgdGhpcyk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ2ZhaWwnLCB0aGlzKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gcmVzaXplIChzcmMsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyksXG4gICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuICAgICAgICBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltZy5zcmMgPSBzcmM7XG4gICAgdmFyIGRpbWVuc2lvbiA9IHNjYWxlKGltZywge3dpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBjYW52YXMud2lkdGggPSBkaW1lbnNpb24ud2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGRpbWVuc2lvbi5oZWlnaHQ7XG4gICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIGRpbWVuc2lvbi53aWR0aCwgZGltZW5zaW9uLmhlaWdodCk7XG5cbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycpO1xufVxuXG5mdW5jdGlvbiBzY2FsZSAoaW1nLCBtYXgpIHtcbiAgICB2YXIgaW1nQVIgPSBpbWcuaGVpZ2h0IC8gaW1nLndpZHRoLFxuICAgICAgICBtYXhBUixcbiAgICAgICAgc2NhbGVXaXRoV2lkdGggPSBmYWxzZTtcblxuICAgIGlmICghbWF4LmhlaWdodCkge1xuICAgICAgICBzY2FsZVdpdGhXaWR0aCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChtYXgud2lkdGggJiYgbWF4LmhlaWdodCkge1xuICAgICAgICBtYXhBUiA9IG1heC5oZWlnaHQgLyBtYXgud2lkdGg7XG4gICAgICAgIGlmIChtYXhBUiA+IGltZ0FSKSB7XG4gICAgICAgICAgICBzY2FsZVdpdGhXaWR0aCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2NhbGVXaXRoV2lkdGgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBtYXgud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IG1heC53aWR0aCAqIGltZ0FSXG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBtYXguaGVpZ2h0IC8gaW1nQVIsXG4gICAgICAgICAgICBoZWlnaHQ6IG1heC5oZWlnaHRcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzaXplO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGVsZW1lbnQgd291bGQgYmUgc2VsZWN0ZWQgYnkgdGhlIHNwZWNpZmllZCBzZWxlY3RvciBzdHJpbmdcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IGVsICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IHNlbGVjdG9yIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBtYXRjaGVzOiBmdW5jdGlvbiAoZWwsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBwID0gRWxlbWVudC5wcm90b3R5cGU7XG4gICAgXHR2YXIgZiA9IHAubWF0Y2hlcyB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IGZ1bmN0aW9uKHMpIHtcbiAgICBcdFx0cmV0dXJuIFtdLmluZGV4T2YuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHMpLCB0aGlzKSAhPT0gLTE7XG4gICAgXHR9O1xuICAgIFx0cmV0dXJuIGYuY2FsbChlbCwgc2VsZWN0b3IpO1xuICAgIH0sXG5cbiAgICBvbjogZnVuY3Rpb24gKGVsLCBldnRUeXBlLCBzZWxlY3RvciwgY2FsbGJhY2spIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihldnRUeXBlLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tYXRjaGVzKGV2dC50YXJnZXQsIHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHdpbmRvdywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHZhbHVlIGZyb20gYXJyYXlcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgICAgICAgYXJyYXkuc3BsaWNlKGFycmF5LmluZGV4T2YoZWwpLCAxKTtcbiAgICB9LFxuXG4gICAgZXh0ZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBzcmM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNyYyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIG9ialtrZXldID0gc3JjW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoIC8gU3Vic2NyaWJlIFBhdHRlcm5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHB1YnN1Yjoge1xuICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9vYnNlcnZlcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vYnNlcnZlcnMgPSB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBpZiAoIShhIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY107XG5cbiAgICAgICAgICAgIGEuc3BsaWNlKGEuaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHVibGlzaDogZnVuY3Rpb24gKHRvcGljKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10sXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIl19
