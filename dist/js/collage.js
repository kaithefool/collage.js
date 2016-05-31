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

function repositionTrans (el, from) {
    var to = el.getBoundingClientRect(),
        diffX = (from.left - to.left) + 'px',
        diffY = (from.top - to.top) + 'px';

    util.transition(el, '');
    util.transform(el, 'translate(' + diffX + ', ' + diffY + ')');
    setTimeout(function () {
        util.transform(el, 'translate(0)');
    }, 50);
}

function swapAnim (el0, el1) {
    var el0From = el0.getBoundingClientRect(),
        el1From = el1.getBoundingClientRect();

    swap(el0, el1);
    repositionTrans(el0, el0From);
    repositionTrans(el1, el1From);
}

var defaults = {
    

};

function Sortable (el, selector) {
    this.selector = selector ? selector : '[draggable]';

    util.on(el, 'dragstart', this.selector, this.ondragstart.bind(this));
    util.on(el, 'dragover', this.selector, this.ondragover.bind(this));
    util.on(el, 'dragend', this.selector, this.ondragend.bind(this));

    el.className += ' collage-sortable';
}

Sortable.prototype = util.extend({

    target: null,

    add: function (el) {
        el.draggable = true;
    },

    ondragstart: function (evt) {
        this.target = evt.target;
        this.target.style.zIndex = 10;
    },

    ondragover: function (evt) {
        if (evt.target !== this.target) {
            swap(evt.target, this.target);
        }
    },

    ondragend: function () {
        this.target.style.zIndex = '';
        this.target = null;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvcmVzaXplLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBGaWxlVXBsb2FkZXIgPSByZXF1aXJlKCcuL2xpYi9GaWxlVXBsb2FkZXIuanMnKSxcbiAgICBGaWxlRHJvcCA9IHJlcXVpcmUoJy4vZWxlbWVudHMvRmlsZURyb3AuanMnKSxcbiAgICBJbWcgPSByZXF1aXJlKCcuL2VsZW1lbnRzL0ltZy5qcycpLFxuICAgIFNvcnRhYmxlID0gcmVxdWlyZSgnLi9lbGVtZW50cy9Tb3J0YWJsZS5qcycpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGFnZTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIGZpbGVEcm9wOiB7fSxcbiAgICBzb3J0YWJsZTogdHJ1ZVxufTtcblxuZnVuY3Rpb24gQ29sbGFnZSAoZWwsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuXG4gICAgLy8gc2V0dXAgdXBsb2FkZXJcbiAgICBpZiAodGhpcy5vcHRzLnVwbG9hZGVyKSB7XG4gICAgICAgIHRoaXMudXBsb2FkZXIgPSBuZXcgRmlsZVVwbG9hZGVyKHRoaXMub3B0cy51cGxvYWRlcik7XG4gICAgfVxuXG4gICAgaWYgKGVsKSB7XG4gICAgICAgIHRoaXMubGlzdCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYWdlLWxpc3QnKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRzLmZpbGVEcm9wKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVkcm9wID0gbmV3IEZpbGVEcm9wKGVsLCB0aGlzLm9wdHMuZmlsZURyb3ApO1xuICAgICAgICAgICAgdGhpcy5maWxlZHJvcC5zdWJzY3JpYmUoJ2ZpbGUnLCB0aGlzLm9uZmlsZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdHMuc29ydGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuc29ydGFibGUgPSBuZXcgU29ydGFibGUodGhpcy5saXN0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQ29sbGFnZS5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB1cGxvYWRlcjogbnVsbCxcblxuICAgIGFkZDogZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW1zKSkge1xuICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZChpdGVtKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2FkZDogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIGltZyA9IHRoaXMuZ2V0SW1nKGl0ZW0pO1xuXG4gICAgICAgIHRoaXMubGlzdC5hcHBlbmRDaGlsZChpbWcuZWwpO1xuXG4gICAgICAgIC8vIHNvcnRhYmxlXG4gICAgICAgIGlmICh0aGlzLnNvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLnNvcnRhYmxlLmFkZChpbWcuZWwpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGdldEltZzogZnVuY3Rpb24gKHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IEltZyhzcmMsIHtcbiAgICAgICAgICAgIHVwbG9hZGVyOiB0aGlzLnVwbG9hZGVyXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbmZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHRoaXMuX2FkZChmaWxlKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZURyb3A7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBtYXhzaXplOiAxMCxcbiAgICBmb3JtYXQ6ICdqcGU/Z3xwbmd8Z2lmJ1xufTtcblxuZnVuY3Rpb24gc3RvcEV2dCAoZXZ0KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xufVxuXG5mdW5jdGlvbiBGaWxlRHJvcCAoZWwsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuICAgIHRoaXMuZWwgPSBlbDtcbiAgICB0aGlzLmlucHV0ID0gZWwucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImZpbGVcIl0nKTtcblxuICAgIC8vIGV2ZW50c1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMub25kcm9wLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgc3RvcEV2dCk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHN0b3BFdnQpO1xuICAgIGlmICh0aGlzLmlucHV0KSB7XG4gICAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5vbmRyb3AuYmluZCh0aGlzKSk7XG4gICAgfVxufVxuXG5GaWxlRHJvcC5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgdmFyIHNpemUgPSBmaWxlLnNpemUgLyAoMTAwMDAwMCkgPD0gdGhpcy5vcHRzLm1heHNpemUsXG4gICAgICAgICAgICBmb3JtYXQgPSBmaWxlLm5hbWUubWF0Y2goJ1xcLignICsgdGhpcy5vcHRzLmZvcm1hdCArICcpJCcpO1xuXG4gICAgICAgIHJldHVybiBzaXplICYmIGZvcm1hdDtcbiAgICB9LFxuXG4gICAgb25kcmFnOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgb25kcm9wOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIC8vIGdldCBmaWxlc1xuICAgICAgICB2YXIgZmlsZXMgPSBldnQuY3VycmVudFRhcmdldC5maWxlcyA/IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzIDogZXZ0LmRhdGFUcmFuc2Zlci5maWxlcztcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyByZXN0cmljdCBmaWxlcyBwZXIgZHJvcFxuICAgICAgICAgICAgaWYgKGkgPiAyMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGVzdCA9IHRoaXMudmFsaWRhdGUoZmlsZXNbaV0pO1xuICAgICAgICAgICAgaWYgKHRlc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1Ymxpc2goJ2ZpbGUnLCBmaWxlc1tpXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaCgnaW52YWxpZCcsIGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKSxcbiAgICByZXNpemUgPSByZXF1aXJlKCcuLy4uL2xpYi9yZXNpemUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWc7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cGxvYWRlcjogbnVsbCxcbiAgICB1cmw6IG51bGwsXG4gICAgcGFyYW1zOiBudWxsXG59O1xuXG5mdW5jdGlvbiBJbWcgKHNyYywgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG4gICAgdGhpcy5zZXRFbCgpO1xuXG4gICAgaWYgKHNyYyBpbnN0YW5jZW9mIEZpbGUpIHtcbiAgICAgICAgLy8gaWYgZmlsZSBpcyBwcm92aWRlZCBhcyBzb3VyY2VcbiAgICAgICAgdGhpcy5maWxlID0gc3JjO1xuICAgICAgICB0aGlzLnNldEVsKHRoaXMub3B0cy51cGxvYWRlcik7XG4gICAgICAgIHRoaXMucmVhZEZpbGUoc3JjKTtcblxuICAgICAgICAvLyB1cGxvYWQgZmlsZVxuICAgICAgICBpZiAodGhpcy5vcHRzLnVwbG9hZGVyKSB7XG4gICAgICAgICAgICB0aGlzLnVwbG9hZCgpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdXJsIGFzIHNvdXJjZVxuICAgICAgICB0aGlzLnNldEVsKCk7XG4gICAgICAgIHRoaXMuc2V0Qmcoc3JjKTtcbiAgICB9XG59XG5cbkltZy5wcm90b3R5cGUgPSB7XG5cbiAgICBzZXRFbDogZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSA9ICdjb2xsYWdlLWltZyc7XG5cbiAgICAgICAgLy8gcHJvZ3Jlc3NcbiAgICAgICAgaWYgKHByb2dyZXNzKSB7XG4gICAgICAgICAgICB0aGlzLmVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwiY29sbGFnZS1wcm9ncmVzc1wiPjxkaXYgY2xhc3M9XCJwcm9ncmVzcy1iYXJcIj48L2Rpdj48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtdGV4dFwiPjwvZGl2PjwvZGl2Pic7XG4gICAgICAgICAgICB0aGlzLnByb2dyZXNzID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcuY29sbGFnZS1wcm9ncmVzcycpO1xuICAgICAgICAgICAgdGhpcy5iYXIgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5wcm9ncmVzcy1iYXInKTtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLnByb2dyZXNzLXRleHQnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZWFkRmlsZTogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IHRoaXMub25yZWFkLmJpbmQodGhpcyk7XG4gICAgICAgIHJlYWRlci5vbmVyciA9IHRoaXMub25lcnIuYmluZCh0aGlzKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgfSxcblxuICAgIG9ucmVhZDogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB2YXIgc3JjID0gcmVzaXplKGV2dC50YXJnZXQucmVzdWx0LCA1MDAsIDUwMCk7XG5cbiAgICAgICAgdGhpcy5zZXRCZyhzcmMpO1xuICAgIH0sXG5cbiAgICBvbmVycjogZnVuY3Rpb24gKCkge1xuXG4gICAgfSxcblxuICAgIHNldEJnOiBmdW5jdGlvbiAoc3JjKSB7XG4gICAgICAgIHRoaXMuZWwuc3R5bGUgPSAnYmFja2dyb3VuZC1pbWFnZTogdXJsKCcgKyBzcmMgKyAnKSc7XG4gICAgfSxcblxuICAgIHNldFByb2dyZXNzOiBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgcHJvZ3Jlc3MgPSBNYXRoLnJvdW5kKHByb2dyZXNzICogMTAwKTtcbiAgICAgICAgdGhpcy5iYXIuc3R5bGUgPSAnd2lkdGg6ICcgKyBwcm9ncmVzcyArICclJztcbiAgICAgICAgdGhpcy50ZXh0LmlubmVySFRNTCA9IHByb2dyZXNzICsgJyUnO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRhc2sgPSB0aGlzLm9wdHMudXBsb2FkZXIudXBsb2FkKHRoaXMuZmlsZSwgdGhpcy5vcHRzLnVybCwgdGhpcy5vcHRzLnBhcmFtcyk7XG5cbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3N1Y2Nlc3MnLCB0aGlzLm9uc3VjY2Vzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3Byb2dyZXNzJywgdGhpcy5vbnByb2dyZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnZmFpbCcsIHRoaXMub25mYWlsLmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh0YXNrLCByZXMpIHtcbiAgICAgICAgdGhpcy5zZXRCZyhyZXMpO1xuICAgICAgICB0aGlzLnByb2dyZXNzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5wcm9ncmVzcyk7XG4gICAgfSxcblxuICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uICh0YXNrLCBwcm9ncmVzcykge1xuICAgICAgICB0aGlzLnNldFByb2dyZXNzKHByb2dyZXNzKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGV4dC5pbm5lckhUTUwgPSAnVXBsb2FkIEZhaWxlZCc7XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTb3J0YWJsZTtcblxuZnVuY3Rpb24gc3dhcCAoZWwwLCBlbDEpIHtcbiAgICB2YXIgZWwwTmV4dCA9IGVsMC5uZXh0U2libGluZyxcbiAgICAgICAgZWwxTmV4dCA9IGVsMS5uZXh0U2libGluZztcblxuICAgIGVsMC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbDAsIGVsMU5leHQpO1xuICAgIGVsMS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbDEsIGVsME5leHQpO1xufVxuXG5mdW5jdGlvbiByZXBvc2l0aW9uVHJhbnMgKGVsLCBmcm9tKSB7XG4gICAgdmFyIHRvID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICAgIGRpZmZYID0gKGZyb20ubGVmdCAtIHRvLmxlZnQpICsgJ3B4JyxcbiAgICAgICAgZGlmZlkgPSAoZnJvbS50b3AgLSB0by50b3ApICsgJ3B4JztcblxuICAgIHV0aWwudHJhbnNpdGlvbihlbCwgJycpO1xuICAgIHV0aWwudHJhbnNmb3JtKGVsLCAndHJhbnNsYXRlKCcgKyBkaWZmWCArICcsICcgKyBkaWZmWSArICcpJyk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHV0aWwudHJhbnNmb3JtKGVsLCAndHJhbnNsYXRlKDApJyk7XG4gICAgfSwgNTApO1xufVxuXG5mdW5jdGlvbiBzd2FwQW5pbSAoZWwwLCBlbDEpIHtcbiAgICB2YXIgZWwwRnJvbSA9IGVsMC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgZWwxRnJvbSA9IGVsMS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIHN3YXAoZWwwLCBlbDEpO1xuICAgIHJlcG9zaXRpb25UcmFucyhlbDAsIGVsMEZyb20pO1xuICAgIHJlcG9zaXRpb25UcmFucyhlbDEsIGVsMUZyb20pO1xufVxuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgXG5cbn07XG5cbmZ1bmN0aW9uIFNvcnRhYmxlIChlbCwgc2VsZWN0b3IpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3IgPyBzZWxlY3RvciA6ICdbZHJhZ2dhYmxlXSc7XG5cbiAgICB1dGlsLm9uKGVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5zZWxlY3RvciwgdGhpcy5vbmRyYWdzdGFydC5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKGVsLCAnZHJhZ292ZXInLCB0aGlzLnNlbGVjdG9yLCB0aGlzLm9uZHJhZ292ZXIuYmluZCh0aGlzKSk7XG4gICAgdXRpbC5vbihlbCwgJ2RyYWdlbmQnLCB0aGlzLnNlbGVjdG9yLCB0aGlzLm9uZHJhZ2VuZC5iaW5kKHRoaXMpKTtcblxuICAgIGVsLmNsYXNzTmFtZSArPSAnIGNvbGxhZ2Utc29ydGFibGUnO1xufVxuXG5Tb3J0YWJsZS5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB0YXJnZXQ6IG51bGwsXG5cbiAgICBhZGQ6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5kcmFnZ2FibGUgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBvbmRyYWdzdGFydDogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGV2dC50YXJnZXQ7XG4gICAgICAgIHRoaXMudGFyZ2V0LnN0eWxlLnpJbmRleCA9IDEwO1xuICAgIH0sXG5cbiAgICBvbmRyYWdvdmVyOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGlmIChldnQudGFyZ2V0ICE9PSB0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgc3dhcChldnQudGFyZ2V0LCB0aGlzLnRhcmdldCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25kcmFnZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0LnN0eWxlLnpJbmRleCA9ICcnO1xuICAgICAgICB0aGlzLnRhcmdldCA9IG51bGw7XG4gICAgfSxcblxuICAgIG9uOiBmdW5jdGlvbiAoKSB7fVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBVcGxvYWRUYXNrID0gcmVxdWlyZSgnLi9VcGxvYWRUYXNrJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVVcGxvYWRlcjtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVybDogbnVsbCxcbiAgICBwYXJhbXM6IG51bGxcbn07XG5cbmZ1bmN0aW9uIEZpbGVVcGxvYWRlciAob3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG59XG5cbkZpbGVVcGxvYWRlci5wcm90b3R5cGUgPSB7XG5cbiAgICBwYXJhbGxlbDogMyxcblxuICAgIHRpbWVvdXRSZXRyeTogMixcblxuICAgIHF1ZXVlOiBbXSxcblxuICAgIHByb2Nlc3Npbmc6IFtdLFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbiAoZmlsZSwgdXJsLCBwYXJhbXMpIHtcbiAgICAgICAgdXJsID0gdXJsID8gdXJsIDogdGhpcy5vcHRzLnVybDtcbiAgICAgICAgcGFyYW1zID0gcGFyYW1zID8gcGFyYW1zIDogdGhpcy5vcHRzLnBhcmFtcztcblxuICAgICAgICB2YXIgdGFzayA9IG5ldyBVcGxvYWRUYXNrKHVybCwgdGhpcy5nZXRGb3JtRGF0YShmaWxlLCBwYXJhbXMpKTtcblxuICAgICAgICAvLyBjYWxsYmFja3NcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3N1Y2Nlc3MnLCB0aGlzLm9uc3VjY2Vzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ2ZhaWwnLCB0aGlzLm9uZmFpbC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3RpbWVvdXQnLCB0aGlzLm9udGltZW91dC5iaW5kKHRoaXMpKTtcblxuICAgICAgICBpZiAodGhpcy5wcm9jZXNzaW5nLmxlbmd0aCA+PSB0aGlzLnBhcmFsbGVsKSB7XG4gICAgICAgICAgICB0aGlzLnF1ZXVlLnB1c2godGFzayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJ1bih0YXNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXNrO1xuICAgIH0sXG5cbiAgICBnZXRGb3JtRGF0YTogZnVuY3Rpb24gKGZpbGUsIHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuXG4gICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSk7XG4gICAgICAgIGlmIChwYXJhbXMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgcGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgZGF0YS5hcHBlbmQoaW5wdXQubmFtZSwgaW5wdXQudmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgcnVuOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLnByb2Nlc3NpbmcucHVzaCh0YXNrKTtcbiAgICAgICAgdGFzay5zdWJtaXQoKTtcbiAgICB9LFxuXG4gICAgZG9uZTogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdXRpbC5yZW1vdmUodGhpcy5wcm9jZXNzaW5nLCB0YXNrKTtcblxuICAgICAgICAvLyBydW4gbmV4dCB0YXNrXG4gICAgICAgIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHRoaXMucXVldWVbMF07XG5cbiAgICAgICAgICAgIHRoaXMucnVuKG5leHQpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmUodGhpcy5xdWV1ZSwgbmV4dCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLmRvbmUodGFzayk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5kb25lKHRhc2spO1xuICAgIH0sXG5cbiAgICBvbnRpbWVvdXQ6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIGlmICh0YXNrLnRpbWVvdXRzID4gdGhpcy50aW1lb3V0UmV0cnkpIHtcbiAgICAgICAgICAgIHRhc2sub25mYWlsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBzdWJtaXQgYWdhaW5cbiAgICAgICAgICAgIHRhc2suc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkVGFzaztcblxuZnVuY3Rpb24gVXBsb2FkVGFzayAodXJsLCBmb3JtRGF0YSkge1xuICAgIHRoaXMudXJsID0gdXJsO1xuICAgIHRoaXMuZm9ybURhdGEgPSBmb3JtRGF0YTtcbn1cblxuVXBsb2FkVGFzay5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB0aW1lb3V0czogMCxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeGhyID0gdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAvLyBldmVudCBoYW5kbGVyc1xuICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSB0aGlzLm9ucHJvZ3Jlc3MuYmluZCh0aGlzKTtcbiAgICAgICAgeGhyLm9udGltZW91dCA9IHRoaXMub250aW1lb3V0LmJpbmQodGhpcyk7XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25zdWNjZXNzKHhocik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh4aHIuc3RhdHVzICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25mYWlsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgLy8gc2VuZCB0aGUgcmVxdWVzdFxuICAgICAgICB4aHIudGltZW91dCA9ICgxMDAwICogNjApO1xuICAgICAgICB4aHIub3BlbigncG9zdCcsIHRoaXMudXJsKTtcbiAgICAgICAgeGhyLnNlbmQodGhpcy5mb3JtRGF0YSk7XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHhocikge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3N1Y2Nlc3MnLCB0aGlzLCB4aHIucmVzcG9uc2VUZXh0LCB4aHIuc3RhdHVzKTtcbiAgICB9LFxuXG4gICAgb25wcm9ncmVzczogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3Byb2dyZXNzJywgdGhpcywgZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCk7XG4gICAgfSxcblxuICAgIG9udGltZW91dDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRpbWVvdXRzICsrO1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3RpbWVvdXQnLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgnZmFpbCcsIHRoaXMpO1xuICAgIH1cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiByZXNpemUgKHNyYywgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSxcbiAgICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyksXG4gICAgICAgIGltZyA9IG5ldyBJbWFnZSgpO1xuXG4gICAgaW1nLnNyYyA9IHNyYztcbiAgICB2YXIgZGltZW5zaW9uID0gc2NhbGUoaW1nLCB7d2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0pO1xuICAgIGNhbnZhcy53aWR0aCA9IGRpbWVuc2lvbi53aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gZGltZW5zaW9uLmhlaWdodDtcbiAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgZGltZW5zaW9uLndpZHRoLCBkaW1lbnNpb24uaGVpZ2h0KTtcblxuICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJyk7XG59XG5cbmZ1bmN0aW9uIHNjYWxlIChpbWcsIG1heCkge1xuICAgIHZhciBpbWdBUiA9IGltZy5oZWlnaHQgLyBpbWcud2lkdGgsXG4gICAgICAgIG1heEFSLFxuICAgICAgICBzY2FsZVdpdGhXaWR0aCA9IGZhbHNlO1xuXG4gICAgaWYgKCFtYXguaGVpZ2h0KSB7XG4gICAgICAgIHNjYWxlV2l0aFdpZHRoID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG1heC53aWR0aCAmJiBtYXguaGVpZ2h0KSB7XG4gICAgICAgIG1heEFSID0gbWF4LmhlaWdodCAvIG1heC53aWR0aDtcbiAgICAgICAgaWYgKG1heEFSID4gaW1nQVIpIHtcbiAgICAgICAgICAgIHNjYWxlV2l0aFdpZHRoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzY2FsZVdpdGhXaWR0aCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IG1heC53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogbWF4LndpZHRoICogaW1nQVJcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IG1heC5oZWlnaHQgLyBpbWdBUixcbiAgICAgICAgICAgIGhlaWdodDogbWF4LmhlaWdodFxuICAgICAgICB9O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXNpemU7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgdHJhbnNpdGlvbjogZnVuY3Rpb24gKGVsLCB0cmFuc2l0aW9uKSB7XG4gICAgICAgIGVsLnN0eWxlLndlYmtpdFRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICAgICAgICBlbC5zdHlsZS5Nb3pUcmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgICAgICAgZWwuc3R5bGUuT1RyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICAgICAgICBlbC5zdHlsZS50cmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgICB9LFxuXG4gICAgdHJhbnNmb3JtOiBmdW5jdGlvbiAoZWwsIHRyYW5zZm9ybSkge1xuICAgICAgICBlbC5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICAgIGVsLnN0eWxlLk1velRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgICAgZWwuc3R5bGUuT1RyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgICAgZWwuc3R5bGUudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBlbGVtZW50IHdvdWxkIGJlIHNlbGVjdGVkIGJ5IHRoZSBzcGVjaWZpZWQgc2VsZWN0b3Igc3RyaW5nXG4gICAgICovXG4gICAgbWF0Y2hlczogZnVuY3Rpb24gKGVsLCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgcCA9IEVsZW1lbnQucHJvdG90eXBlO1xuICAgIFx0dmFyIGYgPSBwLm1hdGNoZXMgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBmdW5jdGlvbihzKSB7XG4gICAgXHRcdHJldHVybiBbXS5pbmRleE9mLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzKSwgdGhpcykgIT09IC0xO1xuICAgIFx0fTtcbiAgICBcdHJldHVybiBmLmNhbGwoZWwsIHNlbGVjdG9yKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgZGVsZWdhdGlvblxuICAgICAqIEBwYXJhbSAge0VsZW1lbnR9ICAgIGVsICAgICAgICAgIFBhcmVudCBOb2RlXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSAgICAgZXZ0VHlwZVxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gICAgIHNlbGVjdG9yXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259ICAgY2FsbGJhY2tcbiAgICAgKiBAcmV0dXJuXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uIChlbCwgZXZ0VHlwZSwgc2VsZWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZ0VHlwZSwgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgaWYgKHRoaXMubWF0Y2hlcyhldnQudGFyZ2V0LCBzZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh3aW5kb3csIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSB2YWx1ZSBmcm9tIGFycmF5XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoYXJyYXksIGVsKSB7XG4gICAgICAgIGFycmF5LnNwbGljZShhcnJheS5pbmRleE9mKGVsKSwgMSk7XG4gICAgfSxcblxuICAgIGV4dGVuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb2JqID0gYXJndW1lbnRzWzBdLFxuICAgICAgICAgICAgc3JjO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzcmMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNyYy5oYXNPd25Qcm9wZXJ0eShrZXkpKSBvYmpba2V5XSA9IHNyY1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaCAvIFN1YnNjcmliZSBQYXR0ZXJuXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBwdWJzdWI6IHtcbiAgICAgICAgc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9waWMsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fb2JzZXJ2ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzID0ge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXTtcblxuICAgICAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgICAgIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW5zdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBhLnNwbGljZShhLmluZGV4T2YoaGFuZGxlciksIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHB1Ymxpc2g6IGZ1bmN0aW9uICh0b3BpYykge1xuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgICAgICAgICBpZiAoYSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBhW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufTtcbiJdfQ==
