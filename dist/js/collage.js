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

        if (this.opts.sortable) {
            this.list = el.querySelector('.collage-list');
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
            if (i > this.filesPerDrop) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvcmVzaXplLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRmlsZVVwbG9hZGVyID0gcmVxdWlyZSgnLi9saWIvRmlsZVVwbG9hZGVyLmpzJyksXG4gICAgRmlsZURyb3AgPSByZXF1aXJlKCcuL2VsZW1lbnRzL0ZpbGVEcm9wLmpzJyksXG4gICAgSW1nID0gcmVxdWlyZSgnLi9lbGVtZW50cy9JbWcuanMnKSxcbiAgICBTb3J0YWJsZSA9IHJlcXVpcmUoJy4vZWxlbWVudHMvU29ydGFibGUuanMnKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi9saWIvdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxhZ2U7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cGxvYWRlcjogbnVsbCxcbiAgICBmaWxlRHJvcDoge30sXG4gICAgc29ydGFibGU6IHRydWVcbn07XG5cbmZ1bmN0aW9uIENvbGxhZ2UgKGVsLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbiAgICB0aGlzLmVsID0gZWw7XG5cbiAgICAvLyBzZXR1cCB1cGxvYWRlclxuICAgIHZhciBmb3JtID0gZWwucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgIGlmICh0aGlzLm9wdHMudXBsb2FkZXIpIHtcbiAgICAgICAgdGhpcy51cGxvYWRlciA9IG5ldyBGaWxlVXBsb2FkZXIodGhpcy5vcHRzLnVwbG9hZGVyKTtcbiAgICB9IGVsc2UgaWYgKGZvcm0pIHtcbiAgICAgICAgdGhpcy51cGxvYWRlciA9IG5ldyBGaWxlVXBsb2FkZXIoe1xuICAgICAgICAgICAgZm9ybTogZm9ybVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoZWwpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5maWxlRHJvcCkge1xuICAgICAgICAgICAgdGhpcy5maWxlZHJvcCA9IG5ldyBGaWxlRHJvcChlbCwgdGhpcy5vcHRzLmZpbGVEcm9wKTtcbiAgICAgICAgICAgIHRoaXMuZmlsZWRyb3Auc3Vic2NyaWJlKCdmaWxlJywgdGhpcy5vbmZpbGUuYmluZCh0aGlzKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRzLnNvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QgPSBlbC5xdWVyeVNlbGVjdG9yKCcuY29sbGFnZS1saXN0Jyk7XG4gICAgICAgICAgICB0aGlzLnNvcnRhYmxlID0gbmV3IFNvcnRhYmxlKHRoaXMubGlzdCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkNvbGxhZ2UucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdXBsb2FkZXI6IG51bGwsXG5cbiAgICBhZGQ6IGZ1bmN0aW9uIChpdGVtcykge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtcykpIHtcbiAgICAgICAgICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9hZGQoaXRlbSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9hZGQ6IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHZhciBpbWcgPSB0aGlzLmltZyhpdGVtKTtcblxuICAgICAgICBpZiAodGhpcy5saXN0KSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QuYXBwZW5kQ2hpbGQoaW1nLmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNvcnRhYmxlXG4gICAgICAgIGlmICh0aGlzLnNvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLnNvcnRhYmxlLmFkZChpbWcuZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wdWJsaXNoKCdvbmFkZCcsIGltZyk7XG4gICAgfSxcblxuICAgIGltZzogZnVuY3Rpb24gKHNyYykge1xuICAgICAgICByZXR1cm4gbmV3IEltZyhzcmMsIHtcbiAgICAgICAgICAgIHVwbG9hZGVyOiB0aGlzLnVwbG9hZGVyXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbmZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHRoaXMuX2FkZChmaWxlKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZURyb3A7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBtYXhzaXplOiAxMCxcbiAgICBmb3JtYXQ6ICdqcGU/Z3xwbmd8Z2lmJyxcbiAgICBmaWxlc1BlckRyb3A6IDIwXG59O1xuXG5mdW5jdGlvbiBzdG9wRXZ0IChldnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5cbmZ1bmN0aW9uIEZpbGVEcm9wIChlbCwgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG4gICAgdGhpcy5lbCA9IGVsO1xuICAgIHRoaXMuaW5wdXQgPSBlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xuXG4gICAgLy8gZXZlbnRzXG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5vbmRyb3AuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBzdG9wRXZ0KTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgc3RvcEV2dCk7XG4gICAgaWYgKHRoaXMuaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLm9uZHJvcC5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbkZpbGVEcm9wLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZSAvICgxMDAwMDAwKSA8PSB0aGlzLm9wdHMubWF4c2l6ZSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGZpbGUubmFtZS5tYXRjaCgnXFwuKCcgKyB0aGlzLm9wdHMuZm9ybWF0ICsgJykkJyk7XG5cbiAgICAgICAgcmV0dXJuIHNpemUgJiYgZm9ybWF0O1xuICAgIH0sXG5cbiAgICBvbmRyYWc6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBvbmRyb3A6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gZ2V0IGZpbGVzXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzID8gZXZ0LmN1cnJlbnRUYXJnZXQuZmlsZXMgOiBldnQuZGF0YVRyYW5zZmVyLmZpbGVzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIHJlc3RyaWN0IGZpbGVzIHBlciBkcm9wXG4gICAgICAgICAgICBpZiAoaSA+IHRoaXMuZmlsZXNQZXJEcm9wKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB0ZXN0ID0gdGhpcy52YWxpZGF0ZShmaWxlc1tpXSk7XG4gICAgICAgICAgICBpZiAodGVzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaCgnZmlsZScsIGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJsaXNoKCdpbnZhbGlkJywgZmlsZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpLFxuICAgIHJlc2l6ZSA9IHJlcXVpcmUoJy4vLi4vbGliL3Jlc2l6ZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltZztcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIHVybDogbnVsbCxcbiAgICBwYXJhbXM6IG51bGxcbn07XG5cbmZ1bmN0aW9uIEltZyAoc3JjLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbiAgICB0aGlzLnNldEVsKCk7XG5cbiAgICBpZiAoc3JjIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAvLyBpZiBmaWxlIGlzIHByb3ZpZGVkIGFzIHNvdXJjZVxuICAgICAgICB0aGlzLmZpbGUgPSBzcmM7XG4gICAgICAgIHRoaXMuc2V0RWwodGhpcy5vcHRzLnVwbG9hZGVyKTtcbiAgICAgICAgdGhpcy5yZWFkRmlsZShzcmMpO1xuXG4gICAgICAgIC8vIHVwbG9hZCBmaWxlXG4gICAgICAgIGlmICh0aGlzLm9wdHMudXBsb2FkZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXBsb2FkKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1cmwgYXMgc291cmNlXG4gICAgICAgIHRoaXMuc2V0RWwoKTtcbiAgICAgICAgdGhpcy5zZXRCZyhzcmMpO1xuICAgIH1cbn1cblxuSW1nLnByb3RvdHlwZSA9IHtcblxuICAgIHNldEVsOiBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIHRoaXMuZWwuY2xhc3NOYW1lID0gJ2NvbGxhZ2UtaW1nJztcblxuICAgICAgICAvLyBwcm9ncmVzc1xuICAgICAgICBpZiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgIHRoaXMuZWwuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJjb2xsYWdlLXByb2dyZXNzXCI+PGRpdiBjbGFzcz1cInByb2dyZXNzLWJhclwiPjwvZGl2PjxkaXYgY2xhc3M9XCJwcm9ncmVzcy10ZXh0XCI+PC9kaXY+PC9kaXY+JztcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYWdlLXByb2dyZXNzJyk7XG4gICAgICAgICAgICB0aGlzLmJhciA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLnByb2dyZXNzLWJhcicpO1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcucHJvZ3Jlc3MtdGV4dCcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlYWRGaWxlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgICByZWFkZXIub25sb2FkID0gdGhpcy5vbnJlYWQuYmluZCh0aGlzKTtcbiAgICAgICAgcmVhZGVyLm9uZXJyID0gdGhpcy5vbmVyci5iaW5kKHRoaXMpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICB9LFxuXG4gICAgb25yZWFkOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHZhciBzcmMgPSByZXNpemUoZXZ0LnRhcmdldC5yZXN1bHQsIDUwMCwgNTAwKTtcblxuICAgICAgICB0aGlzLnNldEJnKHNyYyk7XG4gICAgfSxcblxuICAgIG9uZXJyOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgc2V0Qmc6IGZ1bmN0aW9uIChzcmMpIHtcbiAgICAgICAgdGhpcy5lbC5zdHlsZSA9ICdiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArIHNyYyArICcpJztcbiAgICB9LFxuXG4gICAgc2V0UHJvZ3Jlc3M6IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBwcm9ncmVzcyA9IE1hdGgucm91bmQocHJvZ3Jlc3MgKiAxMDApO1xuICAgICAgICB0aGlzLmJhci5zdHlsZSA9ICd3aWR0aDogJyArIHByb2dyZXNzICsgJyUnO1xuICAgICAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gcHJvZ3Jlc3MgKyAnJSc7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGFzayA9IHRoaXMub3B0cy51cGxvYWRlci51cGxvYWQodGhpcy5maWxlLCB0aGlzLm9wdHMudXJsLCB0aGlzLm9wdHMucGFyYW1zKTtcblxuICAgICAgICB0YXNrLnN1YnNjcmliZSgnc3VjY2VzcycsIHRoaXMub25zdWNjZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgncHJvZ3Jlc3MnLCB0aGlzLm9ucHJvZ3Jlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHRhc2ssIHJlcykge1xuICAgICAgICB0aGlzLnNldEJnKHJlcyk7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnByb2dyZXNzKTtcbiAgICB9LFxuXG4gICAgb25wcm9ncmVzczogZnVuY3Rpb24gKHRhc2ssIHByb2dyZXNzKSB7XG4gICAgICAgIHRoaXMuc2V0UHJvZ3Jlc3MocHJvZ3Jlc3MpO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50ZXh0LmlubmVySFRNTCA9ICdVcGxvYWQgRmFpbGVkJztcbiAgICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNvcnRhYmxlO1xuXG5mdW5jdGlvbiBzd2FwIChlbDAsIGVsMSkge1xuICAgIHZhciBlbDBOZXh0ID0gZWwwLm5leHRTaWJsaW5nLFxuICAgICAgICBlbDFOZXh0ID0gZWwxLm5leHRTaWJsaW5nO1xuXG4gICAgZWwwLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsMCwgZWwxTmV4dCk7XG4gICAgZWwxLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGVsMSwgZWwwTmV4dCk7XG59XG5cbmZ1bmN0aW9uIHJlcG9zaXRpb25UcmFucyAoZWwsIGZyb20pIHtcbiAgICB2YXIgdG8gPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgZGlmZlggPSAoZnJvbS5sZWZ0IC0gdG8ubGVmdCkgKyAncHgnLFxuICAgICAgICBkaWZmWSA9IChmcm9tLnRvcCAtIHRvLnRvcCkgKyAncHgnO1xuXG4gICAgdXRpbC50cmFuc2l0aW9uKGVsLCAnJyk7XG4gICAgdXRpbC50cmFuc2Zvcm0oZWwsICd0cmFuc2xhdGUoJyArIGRpZmZYICsgJywgJyArIGRpZmZZICsgJyknKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdXRpbC50cmFuc2Zvcm0oZWwsICd0cmFuc2xhdGUoMCknKTtcbiAgICB9LCA1MCk7XG59XG5cbmZ1bmN0aW9uIHN3YXBBbmltIChlbDAsIGVsMSkge1xuICAgIHZhciBlbDBGcm9tID0gZWwwLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICBlbDFGcm9tID0gZWwxLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgc3dhcChlbDAsIGVsMSk7XG4gICAgcmVwb3NpdGlvblRyYW5zKGVsMCwgZWwwRnJvbSk7XG4gICAgcmVwb3NpdGlvblRyYW5zKGVsMSwgZWwxRnJvbSk7XG59XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBcblxufTtcblxuZnVuY3Rpb24gU29ydGFibGUgKGVsLCBzZWxlY3Rvcikge1xuICAgIHRoaXMuc2VsZWN0b3IgPSBzZWxlY3RvciA/IHNlbGVjdG9yIDogJ1tkcmFnZ2FibGVdJztcblxuICAgIHV0aWwub24oZWwsICdkcmFnc3RhcnQnLCB0aGlzLnNlbGVjdG9yLCB0aGlzLm9uZHJhZ3N0YXJ0LmJpbmQodGhpcykpO1xuICAgIHV0aWwub24oZWwsICdkcmFnb3ZlcicsIHRoaXMuc2VsZWN0b3IsIHRoaXMub25kcmFnb3Zlci5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKGVsLCAnZHJhZ2VuZCcsIHRoaXMuc2VsZWN0b3IsIHRoaXMub25kcmFnZW5kLmJpbmQodGhpcykpO1xuXG4gICAgZWwuY2xhc3NOYW1lICs9ICcgY29sbGFnZS1zb3J0YWJsZSc7XG59XG5cblNvcnRhYmxlLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHRhcmdldDogbnVsbCxcblxuICAgIGFkZDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgfSxcblxuICAgIG9uZHJhZ3N0YXJ0OiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gZXZ0LnRhcmdldDtcbiAgICAgICAgdGhpcy50YXJnZXQuc3R5bGUuekluZGV4ID0gMTA7XG4gICAgfSxcblxuICAgIG9uZHJhZ292ZXI6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgaWYgKGV2dC50YXJnZXQgIT09IHRoaXMudGFyZ2V0KSB7XG4gICAgICAgICAgICBzd2FwKGV2dC50YXJnZXQsIHRoaXMudGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbmRyYWdlbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50YXJnZXQuc3R5bGUuekluZGV4ID0gJyc7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgb246IGZ1bmN0aW9uICgpIHt9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFVwbG9hZFRhc2sgPSByZXF1aXJlKCcuL1VwbG9hZFRhc2snKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZVVwbG9hZGVyO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgdXJsOiBudWxsLFxuICAgIHBhcmFtczogbnVsbCxcbiAgICBmb3JtOiBudWxsXG59O1xuXG5mdW5jdGlvbiBGaWxlVXBsb2FkZXIgKG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xufVxuXG5GaWxlVXBsb2FkZXIucHJvdG90eXBlID0ge1xuXG4gICAgcGFyYWxsZWw6IDMsXG5cbiAgICB0aW1lb3V0UmV0cnk6IDIsXG5cbiAgICBxdWV1ZTogW10sXG5cbiAgICBwcm9jZXNzaW5nOiBbXSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKGZpbGUsIHVybCwgcGFyYW1zKSB7XG4gICAgICAgIHVybCA9IHVybCA/IHVybCA6ICh0aGlzLm9wdHMudXJsID8gdGhpcy5vcHRzLnVybCA6IHRoaXMub3B0cy5mb3JtLmFjdGlvbik7XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcyA/IHBhcmFtcyA6IHRoaXMub3B0cy5wYXJhbXM7XG5cbiAgICAgICAgdmFyIHRhc2sgPSBuZXcgVXBsb2FkVGFzayh1cmwsIHRoaXMuZ2V0Rm9ybURhdGEoZmlsZSwgcGFyYW1zKSk7XG5cbiAgICAgICAgLy8gY2FsbGJhY2tzXG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdzdWNjZXNzJywgdGhpcy5vbnN1Y2Nlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCd0aW1lb3V0JywgdGhpcy5vbnRpbWVvdXQuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvY2Vzc2luZy5sZW5ndGggPj0gdGhpcy5wYXJhbGxlbCkge1xuICAgICAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKHRhc2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ydW4odGFzayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFzaztcbiAgICB9LFxuXG4gICAgZ2V0Rm9ybURhdGE6IGZ1bmN0aW9uIChmaWxlLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEodGhpcy5vcHRzLmZvcm0pO1xuXG4gICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSk7XG4gICAgICAgIGlmIChwYXJhbXMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgcGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgZGF0YS5hcHBlbmQoaW5wdXQubmFtZSwgaW5wdXQudmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgcnVuOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLnByb2Nlc3NpbmcucHVzaCh0YXNrKTtcbiAgICAgICAgdGFzay5zdWJtaXQoKTtcbiAgICB9LFxuXG4gICAgZG9uZTogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdXRpbC5yZW1vdmUodGhpcy5wcm9jZXNzaW5nLCB0YXNrKTtcblxuICAgICAgICAvLyBydW4gbmV4dCB0YXNrXG4gICAgICAgIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHRoaXMucXVldWVbMF07XG5cbiAgICAgICAgICAgIHRoaXMucnVuKG5leHQpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmUodGhpcy5xdWV1ZSwgbmV4dCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLmRvbmUodGFzayk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5kb25lKHRhc2spO1xuICAgIH0sXG5cbiAgICBvbnRpbWVvdXQ6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIGlmICh0YXNrLnRpbWVvdXRzID4gdGhpcy50aW1lb3V0UmV0cnkpIHtcbiAgICAgICAgICAgIHRhc2sub25mYWlsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBzdWJtaXQgYWdhaW5cbiAgICAgICAgICAgIHRhc2suc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkVGFzaztcblxuZnVuY3Rpb24gVXBsb2FkVGFzayAodXJsLCBmb3JtRGF0YSkge1xuICAgIHRoaXMudXJsID0gdXJsO1xuICAgIHRoaXMuZm9ybURhdGEgPSBmb3JtRGF0YTtcbn1cblxuVXBsb2FkVGFzay5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB0aW1lb3V0czogMCxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeGhyID0gdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAvLyBldmVudCBoYW5kbGVyc1xuICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSB0aGlzLm9ucHJvZ3Jlc3MuYmluZCh0aGlzKTtcbiAgICAgICAgeGhyLm9udGltZW91dCA9IHRoaXMub250aW1lb3V0LmJpbmQodGhpcyk7XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25zdWNjZXNzKHhocik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh4aHIuc3RhdHVzICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25mYWlsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgLy8gc2VuZCB0aGUgcmVxdWVzdFxuICAgICAgICB4aHIudGltZW91dCA9ICgxMDAwICogNjApO1xuICAgICAgICB4aHIub3BlbigncG9zdCcsIHRoaXMudXJsKTtcbiAgICAgICAgeGhyLnNlbmQodGhpcy5mb3JtRGF0YSk7XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHhocikge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3N1Y2Nlc3MnLCB0aGlzLCB4aHIucmVzcG9uc2VUZXh0LCB4aHIuc3RhdHVzKTtcbiAgICB9LFxuXG4gICAgb25wcm9ncmVzczogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3Byb2dyZXNzJywgdGhpcywgZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCk7XG4gICAgfSxcblxuICAgIG9udGltZW91dDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRpbWVvdXRzICsrO1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3RpbWVvdXQnLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgnZmFpbCcsIHRoaXMpO1xuICAgIH1cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiByZXNpemUgKHNyYywgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSxcbiAgICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyksXG4gICAgICAgIGltZyA9IG5ldyBJbWFnZSgpO1xuXG4gICAgaW1nLnNyYyA9IHNyYztcbiAgICB2YXIgZGltZW5zaW9uID0gc2NhbGUoaW1nLCB7d2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0pO1xuICAgIGNhbnZhcy53aWR0aCA9IGRpbWVuc2lvbi53aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gZGltZW5zaW9uLmhlaWdodDtcbiAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgZGltZW5zaW9uLndpZHRoLCBkaW1lbnNpb24uaGVpZ2h0KTtcblxuICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcbn1cblxuZnVuY3Rpb24gc2NhbGUgKGltZywgbWF4KSB7XG4gICAgdmFyIGltZ0FSID0gaW1nLmhlaWdodCAvIGltZy53aWR0aCxcbiAgICAgICAgbWF4QVIsXG4gICAgICAgIHNjYWxlV2l0aFdpZHRoID0gZmFsc2U7XG5cbiAgICBpZiAoIW1heC5oZWlnaHQpIHtcbiAgICAgICAgc2NhbGVXaXRoV2lkdGggPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobWF4LndpZHRoICYmIG1heC5oZWlnaHQpIHtcbiAgICAgICAgbWF4QVIgPSBtYXguaGVpZ2h0IC8gbWF4LndpZHRoO1xuICAgICAgICBpZiAobWF4QVIgPiBpbWdBUikge1xuICAgICAgICAgICAgc2NhbGVXaXRoV2lkdGggPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNjYWxlV2l0aFdpZHRoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogbWF4LndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBtYXgud2lkdGggKiBpbWdBUlxuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogbWF4LmhlaWdodCAvIGltZ0FSLFxuICAgICAgICAgICAgaGVpZ2h0OiBtYXguaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlc2l6ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICB0cmFuc2l0aW9uOiBmdW5jdGlvbiAoZWwsIHRyYW5zaXRpb24pIHtcbiAgICAgICAgZWwuc3R5bGUud2Via2l0VHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XG4gICAgICAgIGVsLnN0eWxlLk1velRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICAgICAgICBlbC5zdHlsZS5PVHJhbnNpdGlvbiA9IHRyYW5zaXRpb247XG4gICAgICAgIGVsLnN0eWxlLnRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICAgIH0sXG5cbiAgICB0cmFuc2Zvcm06IGZ1bmN0aW9uIChlbCwgdHJhbnNmb3JtKSB7XG4gICAgICAgIGVsLnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgICAgZWwuc3R5bGUuTW96VHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgICAgICBlbC5zdHlsZS5PVHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgICAgICBlbC5zdHlsZS50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGVsZW1lbnQgd291bGQgYmUgc2VsZWN0ZWQgYnkgdGhlIHNwZWNpZmllZCBzZWxlY3RvciBzdHJpbmdcbiAgICAgKi9cbiAgICBtYXRjaGVzOiBmdW5jdGlvbiAoZWwsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBwID0gRWxlbWVudC5wcm90b3R5cGU7XG4gICAgXHR2YXIgZiA9IHAubWF0Y2hlcyB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IGZ1bmN0aW9uKHMpIHtcbiAgICBcdFx0cmV0dXJuIFtdLmluZGV4T2YuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHMpLCB0aGlzKSAhPT0gLTE7XG4gICAgXHR9O1xuICAgIFx0cmV0dXJuIGYuY2FsbChlbCwgc2VsZWN0b3IpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBkZWxlZ2F0aW9uXG4gICAgICogQHBhcmFtICB7RWxlbWVudH0gICAgZWwgICAgICAgICAgUGFyZW50IE5vZGVcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgICBldnRUeXBlXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSAgICAgc2VsZWN0b3JcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICBjYWxsYmFja1xuICAgICAqIEByZXR1cm5cbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gKGVsLCBldnRUeXBlLCBzZWxlY3RvciwgY2FsbGJhY2spIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihldnRUeXBlLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tYXRjaGVzKGV2dC50YXJnZXQsIHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHdpbmRvdywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHZhbHVlIGZyb20gYXJyYXlcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgICAgICAgYXJyYXkuc3BsaWNlKGFycmF5LmluZGV4T2YoZWwpLCAxKTtcbiAgICB9LFxuXG4gICAgZXh0ZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBzcmM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNyYyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIG9ialtrZXldID0gc3JjW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoIC8gU3Vic2NyaWJlIFBhdHRlcm5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHB1YnN1Yjoge1xuICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9vYnNlcnZlcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vYnNlcnZlcnMgPSB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBpZiAoIShhIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY107XG5cbiAgICAgICAgICAgIGEuc3BsaWNlKGEuaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHVibGlzaDogZnVuY3Rpb24gKHRvcGljKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10sXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIl19
