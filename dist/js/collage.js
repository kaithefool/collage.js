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
    this.el = el;

    // setup uploader
    var form = el.querySelector('form');
    if (this.opts.uploader) {
        this.uploader = new FileUploader(this.opts.uploader);
    } else if (form) {
        this.uploader = new FileUploader({
            form: form
        });
    }

    if (el) {
        if (this.opts.fileDrop) {
            this.filedrop = new FileDrop(el, this.opts.fileDrop);
            this.filedrop.subscribe('file', this.onfile.bind(this));
        }


        var list = el.querySelector('.collage-list');
        if (list && this.opts.sortable) {
            this.list = list;
            this.sortable = new Sortable(list);
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
        var img = this.img(item);

        if (this.list) {
            this.list.appendChild(img.el);
        }

        // sortable
        if (this.sortable) {
            this.sortable.add(img.el);
        }

        this.publish('onadd', img);
    },

    img: function (src) {
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
    format: 'jpe?g|png|gif',
    filesPerDrop: 20
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
            if (i >= this.filesPerDrop) {
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
    params: null,
    mode: 'bg'
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
        this.el = document.createElement('span');
        this.el.className = 'collage-img' + (this.opts.mode === 'bg' ? ' collage-bg': '');

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
        if (this.opts.mode === 'bg') {
            this.el.style = 'background-image: url(' + src + ')';
        } else {

        }
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
    params: null,
    form: null
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
        url = url ? url : (this.opts.url ? this.opts.url : this.opts.form.action);
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
        var data = new FormData(this.opts.form);

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

    return canvas.toDataURL('image/png');
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

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvcmVzaXplLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBGaWxlVXBsb2FkZXIgPSByZXF1aXJlKCcuL2xpYi9GaWxlVXBsb2FkZXIuanMnKSxcbiAgICBGaWxlRHJvcCA9IHJlcXVpcmUoJy4vZWxlbWVudHMvRmlsZURyb3AuanMnKSxcbiAgICBJbWcgPSByZXF1aXJlKCcuL2VsZW1lbnRzL0ltZy5qcycpLFxuICAgIFNvcnRhYmxlID0gcmVxdWlyZSgnLi9lbGVtZW50cy9Tb3J0YWJsZS5qcycpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGFnZTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIGZpbGVEcm9wOiB7fSxcbiAgICBzb3J0YWJsZTogdHJ1ZVxufTtcblxuZnVuY3Rpb24gQ29sbGFnZSAoZWwsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuICAgIHRoaXMuZWwgPSBlbDtcblxuICAgIC8vIHNldHVwIHVwbG9hZGVyXG4gICAgdmFyIGZvcm0gPSBlbC5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgaWYgKHRoaXMub3B0cy51cGxvYWRlcikge1xuICAgICAgICB0aGlzLnVwbG9hZGVyID0gbmV3IEZpbGVVcGxvYWRlcih0aGlzLm9wdHMudXBsb2FkZXIpO1xuICAgIH0gZWxzZSBpZiAoZm9ybSkge1xuICAgICAgICB0aGlzLnVwbG9hZGVyID0gbmV3IEZpbGVVcGxvYWRlcih7XG4gICAgICAgICAgICBmb3JtOiBmb3JtXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChlbCkge1xuICAgICAgICBpZiAodGhpcy5vcHRzLmZpbGVEcm9wKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVkcm9wID0gbmV3IEZpbGVEcm9wKGVsLCB0aGlzLm9wdHMuZmlsZURyb3ApO1xuICAgICAgICAgICAgdGhpcy5maWxlZHJvcC5zdWJzY3JpYmUoJ2ZpbGUnLCB0aGlzLm9uZmlsZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIGxpc3QgPSBlbC5xdWVyeVNlbGVjdG9yKCcuY29sbGFnZS1saXN0Jyk7XG4gICAgICAgIGlmIChsaXN0ICYmIHRoaXMub3B0cy5zb3J0YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ID0gbGlzdDtcbiAgICAgICAgICAgIHRoaXMuc29ydGFibGUgPSBuZXcgU29ydGFibGUobGlzdCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkNvbGxhZ2UucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdXBsb2FkZXI6IG51bGwsXG5cbiAgICBhZGQ6IGZ1bmN0aW9uIChpdGVtcykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtcykpIHtcbiAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGQoaXRlbSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9hZGQ6IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHZhciBpbWcgPSB0aGlzLmltZyhpdGVtKTtcblxuICAgICAgICBpZiAodGhpcy5saXN0KSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QuYXBwZW5kQ2hpbGQoaW1nLmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNvcnRhYmxlXG4gICAgICAgIGlmICh0aGlzLnNvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLnNvcnRhYmxlLmFkZChpbWcuZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wdWJsaXNoKCdvbmFkZCcsIGltZyk7XG4gICAgfSxcblxuICAgIGltZzogZnVuY3Rpb24gKHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IEltZyhzcmMsIHtcbiAgICAgICAgICAgIHVwbG9hZGVyOiB0aGlzLnVwbG9hZGVyXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbmZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHRoaXMuX2FkZChmaWxlKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZURyb3A7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBtYXhzaXplOiAxMCxcbiAgICBmb3JtYXQ6ICdqcGU/Z3xwbmd8Z2lmJyxcbiAgICBmaWxlc1BlckRyb3A6IDIwXG59O1xuXG5mdW5jdGlvbiBzdG9wRXZ0IChldnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5cbmZ1bmN0aW9uIEZpbGVEcm9wIChlbCwgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG4gICAgdGhpcy5lbCA9IGVsO1xuICAgIHRoaXMuaW5wdXQgPSBlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xuXG4gICAgLy8gZXZlbnRzXG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5vbmRyb3AuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBzdG9wRXZ0KTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgc3RvcEV2dCk7XG4gICAgaWYgKHRoaXMuaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLm9uZHJvcC5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbkZpbGVEcm9wLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZSAvICgxMDAwMDAwKSA8PSB0aGlzLm9wdHMubWF4c2l6ZSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGZpbGUubmFtZS5tYXRjaCgnXFwuKCcgKyB0aGlzLm9wdHMuZm9ybWF0ICsgJykkJyk7XG5cbiAgICAgICAgcmV0dXJuIHNpemUgJiYgZm9ybWF0O1xuICAgIH0sXG5cbiAgICBvbmRyYWc6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBvbmRyb3A6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gZ2V0IGZpbGVzXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzID8gZXZ0LmN1cnJlbnRUYXJnZXQuZmlsZXMgOiBldnQuZGF0YVRyYW5zZmVyLmZpbGVzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIHJlc3RyaWN0IGZpbGVzIHBlciBkcm9wXG4gICAgICAgICAgICBpZiAoaSA+PSB0aGlzLmZpbGVzUGVyRHJvcCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGVzdCA9IHRoaXMudmFsaWRhdGUoZmlsZXNbaV0pO1xuICAgICAgICAgICAgaWYgKHRlc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1Ymxpc2goJ2ZpbGUnLCBmaWxlc1tpXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaCgnaW52YWxpZCcsIGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKSxcbiAgICByZXNpemUgPSByZXF1aXJlKCcuLy4uL2xpYi9yZXNpemUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWc7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cGxvYWRlcjogbnVsbCxcbiAgICB1cmw6IG51bGwsXG4gICAgcGFyYW1zOiBudWxsLFxuICAgIG1vZGU6ICdiZydcbn07XG5cbmZ1bmN0aW9uIEltZyAoc3JjLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbiAgICB0aGlzLnNldEVsKCk7XG5cbiAgICBpZiAoc3JjIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAvLyBpZiBmaWxlIGlzIHByb3ZpZGVkIGFzIHNvdXJjZVxuICAgICAgICB0aGlzLmZpbGUgPSBzcmM7XG4gICAgICAgIHRoaXMuc2V0RWwodGhpcy5vcHRzLnVwbG9hZGVyKTtcbiAgICAgICAgdGhpcy5yZWFkRmlsZShzcmMpO1xuXG4gICAgICAgIC8vIHVwbG9hZCBmaWxlXG4gICAgICAgIGlmICh0aGlzLm9wdHMudXBsb2FkZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXBsb2FkKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1cmwgYXMgc291cmNlXG4gICAgICAgIHRoaXMuc2V0RWwoKTtcbiAgICAgICAgdGhpcy5zZXRCZyhzcmMpO1xuICAgIH1cbn1cblxuSW1nLnByb3RvdHlwZSA9IHtcblxuICAgIHNldEVsOiBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgdGhpcy5lbC5jbGFzc05hbWUgPSAnY29sbGFnZS1pbWcnICsgKHRoaXMub3B0cy5tb2RlID09PSAnYmcnID8gJyBjb2xsYWdlLWJnJzogJycpO1xuXG4gICAgICAgIC8vIHByb2dyZXNzXG4gICAgICAgIGlmIChwcm9ncmVzcykge1xuICAgICAgICAgICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cImNvbGxhZ2UtcHJvZ3Jlc3NcIj48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtYmFyXCI+PC9kaXY+PGRpdiBjbGFzcz1cInByb2dyZXNzLXRleHRcIj48L2Rpdj48L2Rpdj4nO1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLmNvbGxhZ2UtcHJvZ3Jlc3MnKTtcbiAgICAgICAgICAgIHRoaXMuYmFyID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcucHJvZ3Jlc3MtYmFyJyk7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5wcm9ncmVzcy10ZXh0Jyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVhZEZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSB0aGlzLm9ucmVhZC5iaW5kKHRoaXMpO1xuICAgICAgICByZWFkZXIub25lcnIgPSB0aGlzLm9uZXJyLmJpbmQodGhpcyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH0sXG5cbiAgICBvbnJlYWQ6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIHNyYyA9IHJlc2l6ZShldnQudGFyZ2V0LnJlc3VsdCwgNTAwLCA1MDApO1xuXG4gICAgICAgIHRoaXMuc2V0Qmcoc3JjKTtcbiAgICB9LFxuXG4gICAgb25lcnI6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBzZXRCZzogZnVuY3Rpb24gKHNyYykge1xuICAgICAgICBpZiAodGhpcy5vcHRzLm1vZGUgPT09ICdiZycpIHtcbiAgICAgICAgICAgIHRoaXMuZWwuc3R5bGUgPSAnYmFja2dyb3VuZC1pbWFnZTogdXJsKCcgKyBzcmMgKyAnKSc7XG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRQcm9ncmVzczogZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIHByb2dyZXNzID0gTWF0aC5yb3VuZChwcm9ncmVzcyAqIDEwMCk7XG4gICAgICAgIHRoaXMuYmFyLnN0eWxlID0gJ3dpZHRoOiAnICsgcHJvZ3Jlc3MgKyAnJSc7XG4gICAgICAgIHRoaXMudGV4dC5pbm5lckhUTUwgPSBwcm9ncmVzcyArICclJztcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0YXNrID0gdGhpcy5vcHRzLnVwbG9hZGVyLnVwbG9hZCh0aGlzLmZpbGUsIHRoaXMub3B0cy51cmwsIHRoaXMub3B0cy5wYXJhbXMpO1xuXG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdzdWNjZXNzJywgdGhpcy5vbnN1Y2Nlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdwcm9ncmVzcycsIHRoaXMub25wcm9ncmVzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ2ZhaWwnLCB0aGlzLm9uZmFpbC5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAodGFzaywgcmVzKSB7XG4gICAgICAgIHRoaXMuc2V0QmcocmVzKTtcbiAgICAgICAgdGhpcy5wcm9ncmVzcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMucHJvZ3Jlc3MpO1xuICAgIH0sXG5cbiAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAodGFzaywgcHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5zZXRQcm9ncmVzcyhwcm9ncmVzcyk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gJ1VwbG9hZCBGYWlsZWQnO1xuICAgIH1cblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU29ydGFibGU7XG5cbmZ1bmN0aW9uIHN3YXAgKGVsMCwgZWwxKSB7XG4gICAgdmFyIGVsME5leHQgPSBlbDAubmV4dFNpYmxpbmcsXG4gICAgICAgIGVsMU5leHQgPSBlbDEubmV4dFNpYmxpbmc7XG5cbiAgICBlbDAucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwwLCBlbDFOZXh0KTtcbiAgICBlbDEucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwxLCBlbDBOZXh0KTtcbn1cblxuZnVuY3Rpb24gcmVwb3NpdGlvblRyYW5zIChlbCwgZnJvbSkge1xuICAgIHZhciB0byA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICBkaWZmWCA9IChmcm9tLmxlZnQgLSB0by5sZWZ0KSArICdweCcsXG4gICAgICAgIGRpZmZZID0gKGZyb20udG9wIC0gdG8udG9wKSArICdweCc7XG5cbiAgICB1dGlsLnRyYW5zaXRpb24oZWwsICcnKTtcbiAgICB1dGlsLnRyYW5zZm9ybShlbCwgJ3RyYW5zbGF0ZSgnICsgZGlmZlggKyAnLCAnICsgZGlmZlkgKyAnKScpO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB1dGlsLnRyYW5zZm9ybShlbCwgJ3RyYW5zbGF0ZSgwKScpO1xuICAgIH0sIDUwKTtcbn1cblxuZnVuY3Rpb24gc3dhcEFuaW0gKGVsMCwgZWwxKSB7XG4gICAgdmFyIGVsMEZyb20gPSBlbDAuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICAgIGVsMUZyb20gPSBlbDEuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICBzd2FwKGVsMCwgZWwxKTtcbiAgICByZXBvc2l0aW9uVHJhbnMoZWwwLCBlbDBGcm9tKTtcbiAgICByZXBvc2l0aW9uVHJhbnMoZWwxLCBlbDFGcm9tKTtcbn1cblxudmFyIGRlZmF1bHRzID0ge1xuICAgIFxuXG59O1xuXG5mdW5jdGlvbiBTb3J0YWJsZSAoZWwsIHNlbGVjdG9yKSB7XG4gICAgdGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yID8gc2VsZWN0b3IgOiAnW2RyYWdnYWJsZV0nO1xuXG4gICAgdXRpbC5vbihlbCwgJ2RyYWdzdGFydCcsIHRoaXMuc2VsZWN0b3IsIHRoaXMub25kcmFnc3RhcnQuYmluZCh0aGlzKSk7XG4gICAgdXRpbC5vbihlbCwgJ2RyYWdvdmVyJywgdGhpcy5zZWxlY3RvciwgdGhpcy5vbmRyYWdvdmVyLmJpbmQodGhpcykpO1xuICAgIHV0aWwub24oZWwsICdkcmFnZW5kJywgdGhpcy5zZWxlY3RvciwgdGhpcy5vbmRyYWdlbmQuYmluZCh0aGlzKSk7XG5cbiAgICBlbC5jbGFzc05hbWUgKz0gJyBjb2xsYWdlLXNvcnRhYmxlJztcbn1cblxuU29ydGFibGUucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdGFyZ2V0OiBudWxsLFxuXG4gICAgYWRkOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwuZHJhZ2dhYmxlID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgb25kcmFnc3RhcnQ6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBldnQudGFyZ2V0O1xuICAgICAgICB0aGlzLnRhcmdldC5zdHlsZS56SW5kZXggPSAxMDtcbiAgICB9LFxuXG4gICAgb25kcmFnb3ZlcjogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICBpZiAoZXZ0LnRhcmdldCAhPT0gdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHN3YXAoZXZ0LnRhcmdldCwgdGhpcy50YXJnZXQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uZHJhZ2VuZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRhcmdldC5zdHlsZS56SW5kZXggPSAnJztcbiAgICAgICAgdGhpcy50YXJnZXQgPSBudWxsO1xuICAgIH0sXG5cbiAgICBvbjogZnVuY3Rpb24gKCkge31cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVXBsb2FkVGFzayA9IHJlcXVpcmUoJy4vVXBsb2FkVGFzaycpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlVXBsb2FkZXI7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cmw6IG51bGwsXG4gICAgcGFyYW1zOiBudWxsLFxuICAgIGZvcm06IG51bGxcbn07XG5cbmZ1bmN0aW9uIEZpbGVVcGxvYWRlciAob3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG59XG5cbkZpbGVVcGxvYWRlci5wcm90b3R5cGUgPSB7XG5cbiAgICBwYXJhbGxlbDogMyxcblxuICAgIHRpbWVvdXRSZXRyeTogMixcblxuICAgIHF1ZXVlOiBbXSxcblxuICAgIHByb2Nlc3Npbmc6IFtdLFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbiAoZmlsZSwgdXJsLCBwYXJhbXMpIHtcbiAgICAgICAgdXJsID0gdXJsID8gdXJsIDogKHRoaXMub3B0cy51cmwgPyB0aGlzLm9wdHMudXJsIDogdGhpcy5vcHRzLmZvcm0uYWN0aW9uKTtcbiAgICAgICAgcGFyYW1zID0gcGFyYW1zID8gcGFyYW1zIDogdGhpcy5vcHRzLnBhcmFtcztcblxuICAgICAgICB2YXIgdGFzayA9IG5ldyBVcGxvYWRUYXNrKHVybCwgdGhpcy5nZXRGb3JtRGF0YShmaWxlLCBwYXJhbXMpKTtcblxuICAgICAgICAvLyBjYWxsYmFja3NcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3N1Y2Nlc3MnLCB0aGlzLm9uc3VjY2Vzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ2ZhaWwnLCB0aGlzLm9uZmFpbC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3RpbWVvdXQnLCB0aGlzLm9udGltZW91dC5iaW5kKHRoaXMpKTtcblxuICAgICAgICBpZiAodGhpcy5wcm9jZXNzaW5nLmxlbmd0aCA+PSB0aGlzLnBhcmFsbGVsKSB7XG4gICAgICAgICAgICB0aGlzLnF1ZXVlLnB1c2godGFzayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJ1bih0YXNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXNrO1xuICAgIH0sXG5cbiAgICBnZXRGb3JtRGF0YTogZnVuY3Rpb24gKGZpbGUsIHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9IG5ldyBGb3JtRGF0YSh0aGlzLm9wdHMuZm9ybSk7XG5cbiAgICAgICAgZGF0YS5hcHBlbmQoJ2ZpbGUnLCBmaWxlKTtcbiAgICAgICAgaWYgKHBhcmFtcyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBwYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBkYXRhLmFwcGVuZChpbnB1dC5uYW1lLCBpbnB1dC52YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMucHJvY2Vzc2luZy5wdXNoKHRhc2spO1xuICAgICAgICB0YXNrLnN1Ym1pdCgpO1xuICAgIH0sXG5cbiAgICBkb25lOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB1dGlsLnJlbW92ZSh0aGlzLnByb2Nlc3NpbmcsIHRhc2spO1xuXG4gICAgICAgIC8vIHJ1biBuZXh0IHRhc2tcbiAgICAgICAgaWYgKHRoaXMucXVldWUubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gdGhpcy5xdWV1ZVswXTtcblxuICAgICAgICAgICAgdGhpcy5ydW4obmV4dCk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZSh0aGlzLnF1ZXVlLCBuZXh0KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMuZG9uZSh0YXNrKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLmRvbmUodGFzayk7XG4gICAgfSxcblxuICAgIG9udGltZW91dDogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgaWYgKHRhc2sudGltZW91dHMgPiB0aGlzLnRpbWVvdXRSZXRyeSkge1xuICAgICAgICAgICAgdGFzay5vbmZhaWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHN1Ym1pdCBhZ2FpblxuICAgICAgICAgICAgdGFzay5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRUYXNrO1xuXG5mdW5jdGlvbiBVcGxvYWRUYXNrICh1cmwsIGZvcm1EYXRhKSB7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy5mb3JtRGF0YSA9IGZvcm1EYXRhO1xufVxuXG5VcGxvYWRUYXNrLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHRpbWVvdXRzOiAwLFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4aHIgPSB0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgIC8vIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IHRoaXMub25wcm9ncmVzcy5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIub250aW1lb3V0ID0gdGhpcy5vbnRpbWVvdXQuYmluZCh0aGlzKTtcbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MoeGhyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHhoci5zdGF0dXMgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmZhaWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAvLyBzZW5kIHRoZSByZXF1ZXN0XG4gICAgICAgIHhoci50aW1lb3V0ID0gKDEwMDAgKiA2MCk7XG4gICAgICAgIHhoci5vcGVuKCdwb3N0JywgdGhpcy51cmwpO1xuICAgICAgICB4aHIuc2VuZCh0aGlzLmZvcm1EYXRhKTtcbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAoeGhyKSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgnc3VjY2VzcycsIHRoaXMsIHhoci5yZXNwb25zZVRleHQsIHhoci5zdGF0dXMpO1xuICAgIH0sXG5cbiAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgncHJvZ3Jlc3MnLCB0aGlzLCBldnQubG9hZGVkIC8gZXZ0LnRvdGFsKTtcbiAgICB9LFxuXG4gICAgb250aW1lb3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGltZW91dHMgKys7XG4gICAgICAgIHRoaXMucHVibGlzaCgndGltZW91dCcsIHRoaXMpO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdmYWlsJywgdGhpcyk7XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIHJlc2l6ZSAoc3JjLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLFxuICAgICAgICBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSxcbiAgICAgICAgaW1nID0gbmV3IEltYWdlKCk7XG5cbiAgICBpbWcuc3JjID0gc3JjO1xuICAgIHZhciBkaW1lbnNpb24gPSBzY2FsZShpbWcsIHt3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0fSk7XG4gICAgY2FudmFzLndpZHRoID0gZGltZW5zaW9uLndpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBkaW1lbnNpb24uaGVpZ2h0O1xuICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCBkaW1lbnNpb24ud2lkdGgsIGRpbWVuc2lvbi5oZWlnaHQpO1xuXG4gICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xufVxuXG5mdW5jdGlvbiBzY2FsZSAoaW1nLCBtYXgpIHtcbiAgICB2YXIgaW1nQVIgPSBpbWcuaGVpZ2h0IC8gaW1nLndpZHRoLFxuICAgICAgICBtYXhBUixcbiAgICAgICAgc2NhbGVXaXRoV2lkdGggPSBmYWxzZTtcblxuICAgIGlmICghbWF4LmhlaWdodCkge1xuICAgICAgICBzY2FsZVdpdGhXaWR0aCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChtYXgud2lkdGggJiYgbWF4LmhlaWdodCkge1xuICAgICAgICBtYXhBUiA9IG1heC5oZWlnaHQgLyBtYXgud2lkdGg7XG4gICAgICAgIGlmIChtYXhBUiA+IGltZ0FSKSB7XG4gICAgICAgICAgICBzY2FsZVdpdGhXaWR0aCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2NhbGVXaXRoV2lkdGgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBtYXgud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IG1heC53aWR0aCAqIGltZ0FSXG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBtYXguaGVpZ2h0IC8gaW1nQVIsXG4gICAgICAgICAgICBoZWlnaHQ6IG1heC5oZWlnaHRcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzaXplO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIHRyYW5zaXRpb246IGZ1bmN0aW9uIChlbCwgdHJhbnNpdGlvbikge1xuICAgICAgICBlbC5zdHlsZS53ZWJraXRUcmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgICAgICAgZWwuc3R5bGUuTW96VHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XG4gICAgICAgIGVsLnN0eWxlLk9UcmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgICAgICAgZWwuc3R5bGUudHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XG4gICAgfSxcblxuICAgIHRyYW5zZm9ybTogZnVuY3Rpb24gKGVsLCB0cmFuc2Zvcm0pIHtcbiAgICAgICAgZWwuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgICAgICBlbC5zdHlsZS5Nb3pUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICAgIGVsLnN0eWxlLk9UcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICAgIGVsLnN0eWxlLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgZWxlbWVudCB3b3VsZCBiZSBzZWxlY3RlZCBieSB0aGUgc3BlY2lmaWVkIHNlbGVjdG9yIHN0cmluZ1xuICAgICAqL1xuICAgIG1hdGNoZXM6IGZ1bmN0aW9uIChlbCwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHAgPSBFbGVtZW50LnByb3RvdHlwZTtcbiAgICBcdHZhciBmID0gcC5tYXRjaGVzIHx8IHAud2Via2l0TWF0Y2hlc1NlbGVjdG9yIHx8IHAubW96TWF0Y2hlc1NlbGVjdG9yIHx8IHAubXNNYXRjaGVzU2VsZWN0b3IgfHwgZnVuY3Rpb24ocykge1xuICAgIFx0XHRyZXR1cm4gW10uaW5kZXhPZi5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocyksIHRoaXMpICE9PSAtMTtcbiAgICBcdH07XG4gICAgXHRyZXR1cm4gZi5jYWxsKGVsLCBzZWxlY3Rvcik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGRlbGVnYXRpb25cbiAgICAgKiBAcGFyYW0gIHtFbGVtZW50fSAgICBlbCAgICAgICAgICBQYXJlbnQgTm9kZVxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gICAgIGV2dFR5cGVcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgICBzZWxlY3RvclxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSAgIGNhbGxiYWNrXG4gICAgICogQHJldHVyblxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbiAoZWwsIGV2dFR5cGUsIHNlbGVjdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKGV2dFR5cGUsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1hdGNoZXMoZXZ0LnRhcmdldCwgc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkod2luZG93LCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdmFsdWUgZnJvbSBhcnJheVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICAgICAgICBhcnJheS5zcGxpY2UoYXJyYXkuaW5kZXhPZihlbCksIDEpO1xuICAgIH0sXG5cbiAgICBleHRlbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICAgIHNyYztcblxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc3JjID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHNyYykge1xuICAgICAgICAgICAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoa2V5KSkgb2JqW2tleV0gPSBzcmNba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFB1Ymxpc2ggLyBTdWJzY3JpYmUgUGF0dGVyblxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgcHVic3ViOiB7XG4gICAgICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX29ic2VydmVycykge1xuICAgICAgICAgICAgICAgIHRoaXMuX29ic2VydmVycyA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY107XG5cbiAgICAgICAgICAgIGlmICghKGEgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVuc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9waWMsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXTtcblxuICAgICAgICAgICAgYS5zcGxpY2UoYS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgfSxcblxuICAgICAgICBwdWJsaXNoOiBmdW5jdGlvbiAodG9waWMpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fb2JzZXJ2ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb2JzZXJ2ZXJzID0ge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXSxcbiAgICAgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgICAgICAgICAgaWYgKGEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYVtpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG4iXX0=
