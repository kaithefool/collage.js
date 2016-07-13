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
    sortable: true,
    img: {}
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


        var list = this.list = el.querySelector('.collage-list');
        if (list && this.opts.sortable) {
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
        return new Img(src, util.extend({
            uploader: this.uploader
        }, this.opts.img));
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
        this.setSrc(src);
    }
}

Img.prototype = {

    setEl: function (progress) {
        this.el = util.createElement('<span class="collage-img"></span>');

        // inline mode
        if (this.opts.mode === 'inline') {
            this.img = new Image();
            this.el.appendChild(this.img);
        }
        // bg mode
        if (this.opts.mode === 'bg') {
            this.el.className += ' collage-img-bg';
        }

        // progress
        if (progress) {
            this.el.appendChild(util.createElement(
                '<div class="collage-progress">' +
                    '<div class="progress-bar"></div>' +
                    '<div class="progress-text"></div>' +
                '</div>'
            ));
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

        this.setSrc(src);
    },

    onerr: function () {

    },

    setSrc: function (src) {
        if (this.opts.mode === 'bg') {
            this.el.style = 'background-image: url(' + src + ')';
        } else {
            this.img.src = src;
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
        this.setSrc(res);
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

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvcmVzaXplLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRmlsZVVwbG9hZGVyID0gcmVxdWlyZSgnLi9saWIvRmlsZVVwbG9hZGVyLmpzJyksXG4gICAgRmlsZURyb3AgPSByZXF1aXJlKCcuL2VsZW1lbnRzL0ZpbGVEcm9wLmpzJyksXG4gICAgSW1nID0gcmVxdWlyZSgnLi9lbGVtZW50cy9JbWcuanMnKSxcbiAgICBTb3J0YWJsZSA9IHJlcXVpcmUoJy4vZWxlbWVudHMvU29ydGFibGUuanMnKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi9saWIvdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxhZ2U7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cGxvYWRlcjogbnVsbCxcbiAgICBmaWxlRHJvcDoge30sXG4gICAgc29ydGFibGU6IHRydWUsXG4gICAgaW1nOiB7fVxufTtcblxuZnVuY3Rpb24gQ29sbGFnZSAoZWwsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuICAgIHRoaXMuZWwgPSBlbDtcblxuICAgIC8vIHNldHVwIHVwbG9hZGVyXG4gICAgdmFyIGZvcm0gPSBlbC5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XG4gICAgaWYgKHRoaXMub3B0cy51cGxvYWRlcikge1xuICAgICAgICB0aGlzLnVwbG9hZGVyID0gbmV3IEZpbGVVcGxvYWRlcih0aGlzLm9wdHMudXBsb2FkZXIpO1xuICAgIH0gZWxzZSBpZiAoZm9ybSkge1xuICAgICAgICB0aGlzLnVwbG9hZGVyID0gbmV3IEZpbGVVcGxvYWRlcih7XG4gICAgICAgICAgICBmb3JtOiBmb3JtXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChlbCkge1xuICAgICAgICBpZiAodGhpcy5vcHRzLmZpbGVEcm9wKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVkcm9wID0gbmV3IEZpbGVEcm9wKGVsLCB0aGlzLm9wdHMuZmlsZURyb3ApO1xuICAgICAgICAgICAgdGhpcy5maWxlZHJvcC5zdWJzY3JpYmUoJ2ZpbGUnLCB0aGlzLm9uZmlsZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLmxpc3QgPSBlbC5xdWVyeVNlbGVjdG9yKCcuY29sbGFnZS1saXN0Jyk7XG4gICAgICAgIGlmIChsaXN0ICYmIHRoaXMub3B0cy5zb3J0YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5zb3J0YWJsZSA9IG5ldyBTb3J0YWJsZShsaXN0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQ29sbGFnZS5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB1cGxvYWRlcjogbnVsbCxcblxuICAgIGFkZDogZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW1zKSkge1xuICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZChpdGVtKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2FkZDogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIGltZyA9IHRoaXMuaW1nKGl0ZW0pO1xuXG4gICAgICAgIGlmICh0aGlzLmxpc3QpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdC5hcHBlbmRDaGlsZChpbWcuZWwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gc29ydGFibGVcbiAgICAgICAgaWYgKHRoaXMuc29ydGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuc29ydGFibGUuYWRkKGltZy5lbCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnB1Ymxpc2goJ29uYWRkJywgaW1nKTtcbiAgICB9LFxuXG4gICAgaW1nOiBmdW5jdGlvbiAoc3JjKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW1nKHNyYywgdXRpbC5leHRlbmQoe1xuICAgICAgICAgICAgdXBsb2FkZXI6IHRoaXMudXBsb2FkZXJcbiAgICAgICAgfSwgdGhpcy5vcHRzLmltZykpO1xuICAgIH0sXG5cbiAgICBvbmZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHRoaXMuX2FkZChmaWxlKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZURyb3A7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBtYXhzaXplOiAxMCxcbiAgICBmb3JtYXQ6ICdqcGU/Z3xwbmd8Z2lmJyxcbiAgICBmaWxlc1BlckRyb3A6IDIwXG59O1xuXG5mdW5jdGlvbiBzdG9wRXZ0IChldnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5cbmZ1bmN0aW9uIEZpbGVEcm9wIChlbCwgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG4gICAgdGhpcy5lbCA9IGVsO1xuICAgIHRoaXMuaW5wdXQgPSBlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xuXG4gICAgLy8gZXZlbnRzXG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5vbmRyb3AuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBzdG9wRXZ0KTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgc3RvcEV2dCk7XG4gICAgaWYgKHRoaXMuaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLm9uZHJvcC5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbkZpbGVEcm9wLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZSAvICgxMDAwMDAwKSA8PSB0aGlzLm9wdHMubWF4c2l6ZSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGZpbGUubmFtZS5tYXRjaCgnXFwuKCcgKyB0aGlzLm9wdHMuZm9ybWF0ICsgJykkJyk7XG5cbiAgICAgICAgcmV0dXJuIHNpemUgJiYgZm9ybWF0O1xuICAgIH0sXG5cbiAgICBvbmRyYWc6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBvbmRyb3A6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gZ2V0IGZpbGVzXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzID8gZXZ0LmN1cnJlbnRUYXJnZXQuZmlsZXMgOiBldnQuZGF0YVRyYW5zZmVyLmZpbGVzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIHJlc3RyaWN0IGZpbGVzIHBlciBkcm9wXG4gICAgICAgICAgICBpZiAoaSA+PSB0aGlzLmZpbGVzUGVyRHJvcCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGVzdCA9IHRoaXMudmFsaWRhdGUoZmlsZXNbaV0pO1xuICAgICAgICAgICAgaWYgKHRlc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1Ymxpc2goJ2ZpbGUnLCBmaWxlc1tpXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaCgnaW52YWxpZCcsIGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKSxcbiAgICByZXNpemUgPSByZXF1aXJlKCcuLy4uL2xpYi9yZXNpemUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWc7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cGxvYWRlcjogbnVsbCxcbiAgICB1cmw6IG51bGwsXG4gICAgcGFyYW1zOiBudWxsLFxuICAgIG1vZGU6ICdiZydcbn07XG5cbmZ1bmN0aW9uIEltZyAoc3JjLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbiAgICB0aGlzLnNldEVsKCk7XG5cbiAgICBpZiAoc3JjIGluc3RhbmNlb2YgRmlsZSkge1xuICAgICAgICAvLyBpZiBmaWxlIGlzIHByb3ZpZGVkIGFzIHNvdXJjZVxuICAgICAgICB0aGlzLmZpbGUgPSBzcmM7XG4gICAgICAgIHRoaXMuc2V0RWwodGhpcy5vcHRzLnVwbG9hZGVyKTtcbiAgICAgICAgdGhpcy5yZWFkRmlsZShzcmMpO1xuXG4gICAgICAgIC8vIHVwbG9hZCBmaWxlXG4gICAgICAgIGlmICh0aGlzLm9wdHMudXBsb2FkZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXBsb2FkKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1cmwgYXMgc291cmNlXG4gICAgICAgIHRoaXMuc2V0RWwoKTtcbiAgICAgICAgdGhpcy5zZXRTcmMoc3JjKTtcbiAgICB9XG59XG5cbkltZy5wcm90b3R5cGUgPSB7XG5cbiAgICBzZXRFbDogZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIHRoaXMuZWwgPSB1dGlsLmNyZWF0ZUVsZW1lbnQoJzxzcGFuIGNsYXNzPVwiY29sbGFnZS1pbWdcIj48L3NwYW4+Jyk7XG5cbiAgICAgICAgLy8gaW5saW5lIG1vZGVcbiAgICAgICAgaWYgKHRoaXMub3B0cy5tb2RlID09PSAnaW5saW5lJykge1xuICAgICAgICAgICAgdGhpcy5pbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5pbWcpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGJnIG1vZGVcbiAgICAgICAgaWYgKHRoaXMub3B0cy5tb2RlID09PSAnYmcnKSB7XG4gICAgICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSArPSAnIGNvbGxhZ2UtaW1nLWJnJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHByb2dyZXNzXG4gICAgICAgIGlmIChwcm9ncmVzcykge1xuICAgICAgICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh1dGlsLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb2xsYWdlLXByb2dyZXNzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtYmFyXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtdGV4dFwiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nXG4gICAgICAgICAgICApKTtcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYWdlLXByb2dyZXNzJyk7XG4gICAgICAgICAgICB0aGlzLmJhciA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLnByb2dyZXNzLWJhcicpO1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcucHJvZ3Jlc3MtdGV4dCcpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlYWRGaWxlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgICByZWFkZXIub25sb2FkID0gdGhpcy5vbnJlYWQuYmluZCh0aGlzKTtcbiAgICAgICAgcmVhZGVyLm9uZXJyID0gdGhpcy5vbmVyci5iaW5kKHRoaXMpO1xuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICB9LFxuXG4gICAgb25yZWFkOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHZhciBzcmMgPSByZXNpemUoZXZ0LnRhcmdldC5yZXN1bHQsIDUwMCwgNTAwKTtcblxuICAgICAgICB0aGlzLnNldFNyYyhzcmMpO1xuICAgIH0sXG5cbiAgICBvbmVycjogZnVuY3Rpb24gKCkge1xuXG4gICAgfSxcblxuICAgIHNldFNyYzogZnVuY3Rpb24gKHNyYykge1xuICAgICAgICBpZiAodGhpcy5vcHRzLm1vZGUgPT09ICdiZycpIHtcbiAgICAgICAgICAgIHRoaXMuZWwuc3R5bGUgPSAnYmFja2dyb3VuZC1pbWFnZTogdXJsKCcgKyBzcmMgKyAnKSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmltZy5zcmMgPSBzcmM7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0UHJvZ3Jlc3M6IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBwcm9ncmVzcyA9IE1hdGgucm91bmQocHJvZ3Jlc3MgKiAxMDApO1xuICAgICAgICB0aGlzLmJhci5zdHlsZSA9ICd3aWR0aDogJyArIHByb2dyZXNzICsgJyUnO1xuICAgICAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gcHJvZ3Jlc3MgKyAnJSc7XG4gICAgfSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGFzayA9IHRoaXMub3B0cy51cGxvYWRlci51cGxvYWQodGhpcy5maWxlLCB0aGlzLm9wdHMudXJsLCB0aGlzLm9wdHMucGFyYW1zKTtcblxuICAgICAgICB0YXNrLnN1YnNjcmliZSgnc3VjY2VzcycsIHRoaXMub25zdWNjZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgncHJvZ3Jlc3MnLCB0aGlzLm9ucHJvZ3Jlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHRhc2ssIHJlcykge1xuICAgICAgICB0aGlzLnNldFNyYyhyZXMpO1xuICAgICAgICB0aGlzLnByb2dyZXNzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5wcm9ncmVzcyk7XG4gICAgfSxcblxuICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uICh0YXNrLCBwcm9ncmVzcykge1xuICAgICAgICB0aGlzLnNldFByb2dyZXNzKHByb2dyZXNzKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGV4dC5pbm5lckhUTUwgPSAnVXBsb2FkIEZhaWxlZCc7XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTb3J0YWJsZTtcblxuZnVuY3Rpb24gc3dhcCAoZWwwLCBlbDEpIHtcbiAgICB2YXIgZWwwTmV4dCA9IGVsMC5uZXh0U2libGluZyxcbiAgICAgICAgZWwxTmV4dCA9IGVsMS5uZXh0U2libGluZztcblxuICAgIGVsMC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbDAsIGVsMU5leHQpO1xuICAgIGVsMS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbDEsIGVsME5leHQpO1xufVxuXG5mdW5jdGlvbiByZXBvc2l0aW9uVHJhbnMgKGVsLCBmcm9tKSB7XG4gICAgdmFyIHRvID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksXG4gICAgICAgIGRpZmZYID0gKGZyb20ubGVmdCAtIHRvLmxlZnQpICsgJ3B4JyxcbiAgICAgICAgZGlmZlkgPSAoZnJvbS50b3AgLSB0by50b3ApICsgJ3B4JztcblxuICAgIHV0aWwudHJhbnNpdGlvbihlbCwgJycpO1xuICAgIHV0aWwudHJhbnNmb3JtKGVsLCAndHJhbnNsYXRlKCcgKyBkaWZmWCArICcsICcgKyBkaWZmWSArICcpJyk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHV0aWwudHJhbnNmb3JtKGVsLCAndHJhbnNsYXRlKDApJyk7XG4gICAgfSwgNTApO1xufVxuXG5mdW5jdGlvbiBzd2FwQW5pbSAoZWwwLCBlbDEpIHtcbiAgICB2YXIgZWwwRnJvbSA9IGVsMC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgZWwxRnJvbSA9IGVsMS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIHN3YXAoZWwwLCBlbDEpO1xuICAgIHJlcG9zaXRpb25UcmFucyhlbDAsIGVsMEZyb20pO1xuICAgIHJlcG9zaXRpb25UcmFucyhlbDEsIGVsMUZyb20pO1xufVxuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgXG5cbn07XG5cbmZ1bmN0aW9uIFNvcnRhYmxlIChlbCwgc2VsZWN0b3IpIHtcbiAgICB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3IgPyBzZWxlY3RvciA6ICdbZHJhZ2dhYmxlXSc7XG5cbiAgICB1dGlsLm9uKGVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5zZWxlY3RvciwgdGhpcy5vbmRyYWdzdGFydC5iaW5kKHRoaXMpKTtcbiAgICB1dGlsLm9uKGVsLCAnZHJhZ292ZXInLCB0aGlzLnNlbGVjdG9yLCB0aGlzLm9uZHJhZ292ZXIuYmluZCh0aGlzKSk7XG4gICAgdXRpbC5vbihlbCwgJ2RyYWdlbmQnLCB0aGlzLnNlbGVjdG9yLCB0aGlzLm9uZHJhZ2VuZC5iaW5kKHRoaXMpKTtcblxuICAgIGVsLmNsYXNzTmFtZSArPSAnIGNvbGxhZ2Utc29ydGFibGUnO1xufVxuXG5Tb3J0YWJsZS5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB0YXJnZXQ6IG51bGwsXG5cbiAgICBhZGQ6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5kcmFnZ2FibGUgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBvbmRyYWdzdGFydDogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGV2dC50YXJnZXQ7XG4gICAgICAgIHRoaXMudGFyZ2V0LnN0eWxlLnpJbmRleCA9IDEwO1xuICAgIH0sXG5cbiAgICBvbmRyYWdvdmVyOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGlmIChldnQudGFyZ2V0ICE9PSB0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgc3dhcChldnQudGFyZ2V0LCB0aGlzLnRhcmdldCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25kcmFnZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0LnN0eWxlLnpJbmRleCA9ICcnO1xuICAgICAgICB0aGlzLnRhcmdldCA9IG51bGw7XG4gICAgfSxcblxuICAgIG9uOiBmdW5jdGlvbiAoKSB7fVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBVcGxvYWRUYXNrID0gcmVxdWlyZSgnLi9VcGxvYWRUYXNrJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVVcGxvYWRlcjtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVybDogbnVsbCxcbiAgICBwYXJhbXM6IG51bGwsXG4gICAgZm9ybTogbnVsbFxufTtcblxuZnVuY3Rpb24gRmlsZVVwbG9hZGVyIChvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbn1cblxuRmlsZVVwbG9hZGVyLnByb3RvdHlwZSA9IHtcblxuICAgIHBhcmFsbGVsOiAzLFxuXG4gICAgdGltZW91dFJldHJ5OiAyLFxuXG4gICAgcXVldWU6IFtdLFxuXG4gICAgcHJvY2Vzc2luZzogW10sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uIChmaWxlLCB1cmwsIHBhcmFtcykge1xuICAgICAgICB1cmwgPSB1cmwgPyB1cmwgOiAodGhpcy5vcHRzLnVybCA/IHRoaXMub3B0cy51cmwgOiB0aGlzLm9wdHMuZm9ybS5hY3Rpb24pO1xuICAgICAgICBwYXJhbXMgPSBwYXJhbXMgPyBwYXJhbXMgOiB0aGlzLm9wdHMucGFyYW1zO1xuXG4gICAgICAgIHZhciB0YXNrID0gbmV3IFVwbG9hZFRhc2sodXJsLCB0aGlzLmdldEZvcm1EYXRhKGZpbGUsIHBhcmFtcykpO1xuXG4gICAgICAgIC8vIGNhbGxiYWNrc1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnc3VjY2VzcycsIHRoaXMub25zdWNjZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnZmFpbCcsIHRoaXMub25mYWlsLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgndGltZW91dCcsIHRoaXMub250aW1lb3V0LmJpbmQodGhpcykpO1xuXG4gICAgICAgIGlmICh0aGlzLnByb2Nlc3NpbmcubGVuZ3RoID49IHRoaXMucGFyYWxsZWwpIHtcbiAgICAgICAgICAgIHRoaXMucXVldWUucHVzaCh0YXNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucnVuKHRhc2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhc2s7XG4gICAgfSxcblxuICAgIGdldEZvcm1EYXRhOiBmdW5jdGlvbiAoZmlsZSwgcGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKHRoaXMub3B0cy5mb3JtKTtcblxuICAgICAgICBkYXRhLmFwcGVuZCgnZmlsZScsIGZpbGUpO1xuICAgICAgICBpZiAocGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgICAgIGRhdGEuYXBwZW5kKGlucHV0Lm5hbWUsIGlucHV0LnZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIHJ1bjogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5wcm9jZXNzaW5nLnB1c2godGFzayk7XG4gICAgICAgIHRhc2suc3VibWl0KCk7XG4gICAgfSxcblxuICAgIGRvbmU6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlKHRoaXMucHJvY2Vzc2luZywgdGFzayk7XG5cbiAgICAgICAgLy8gcnVuIG5leHQgdGFza1xuICAgICAgICBpZiAodGhpcy5xdWV1ZS5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSB0aGlzLnF1ZXVlWzBdO1xuXG4gICAgICAgICAgICB0aGlzLnJ1bihuZXh0KTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlKHRoaXMucXVldWUsIG5leHQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5kb25lKHRhc2spO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMuZG9uZSh0YXNrKTtcbiAgICB9LFxuXG4gICAgb250aW1lb3V0OiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBpZiAodGFzay50aW1lb3V0cyA+IHRoaXMudGltZW91dFJldHJ5KSB7XG4gICAgICAgICAgICB0YXNrLm9uZmFpbCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc3VibWl0IGFnYWluXG4gICAgICAgICAgICB0YXNrLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZFRhc2s7XG5cbmZ1bmN0aW9uIFVwbG9hZFRhc2sgKHVybCwgZm9ybURhdGEpIHtcbiAgICB0aGlzLnVybCA9IHVybDtcbiAgICB0aGlzLmZvcm1EYXRhID0gZm9ybURhdGE7XG59XG5cblVwbG9hZFRhc2sucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdGltZW91dHM6IDAsXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHhociA9IHRoaXMueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgLy8gZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gdGhpcy5vbnByb2dyZXNzLmJpbmQodGhpcyk7XG4gICAgICAgIHhoci5vbnRpbWVvdXQgPSB0aGlzLm9udGltZW91dC5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uc3VjY2Vzcyh4aHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeGhyLnN0YXR1cyAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uZmFpbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8vIHNlbmQgdGhlIHJlcXVlc3RcbiAgICAgICAgeGhyLnRpbWVvdXQgPSAoMTAwMCAqIDYwKTtcbiAgICAgICAgeGhyLm9wZW4oJ3Bvc3QnLCB0aGlzLnVybCk7XG4gICAgICAgIHhoci5zZW5kKHRoaXMuZm9ybURhdGEpO1xuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh4aHIpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdzdWNjZXNzJywgdGhpcywgeGhyLnJlc3BvbnNlVGV4dCwgeGhyLnN0YXR1cyk7XG4gICAgfSxcblxuICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdwcm9ncmVzcycsIHRoaXMsIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgIH0sXG5cbiAgICBvbnRpbWVvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0cyArKztcbiAgICAgICAgdGhpcy5wdWJsaXNoKCd0aW1lb3V0JywgdGhpcyk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ2ZhaWwnLCB0aGlzKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gcmVzaXplIChzcmMsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyksXG4gICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuICAgICAgICBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltZy5zcmMgPSBzcmM7XG4gICAgdmFyIGRpbWVuc2lvbiA9IHNjYWxlKGltZywge3dpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBjYW52YXMud2lkdGggPSBkaW1lbnNpb24ud2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGRpbWVuc2lvbi5oZWlnaHQ7XG4gICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIGRpbWVuc2lvbi53aWR0aCwgZGltZW5zaW9uLmhlaWdodCk7XG5cbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XG59XG5cbmZ1bmN0aW9uIHNjYWxlIChpbWcsIG1heCkge1xuICAgIHZhciBpbWdBUiA9IGltZy5oZWlnaHQgLyBpbWcud2lkdGgsXG4gICAgICAgIG1heEFSLFxuICAgICAgICBzY2FsZVdpdGhXaWR0aCA9IGZhbHNlO1xuXG4gICAgaWYgKCFtYXguaGVpZ2h0KSB7XG4gICAgICAgIHNjYWxlV2l0aFdpZHRoID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG1heC53aWR0aCAmJiBtYXguaGVpZ2h0KSB7XG4gICAgICAgIG1heEFSID0gbWF4LmhlaWdodCAvIG1heC53aWR0aDtcbiAgICAgICAgaWYgKG1heEFSID4gaW1nQVIpIHtcbiAgICAgICAgICAgIHNjYWxlV2l0aFdpZHRoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzY2FsZVdpdGhXaWR0aCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IG1heC53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogbWF4LndpZHRoICogaW1nQVJcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6IG1heC5oZWlnaHQgLyBpbWdBUixcbiAgICAgICAgICAgIGhlaWdodDogbWF4LmhlaWdodFxuICAgICAgICB9O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXNpemU7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgdHJhbnNpdGlvbjogZnVuY3Rpb24gKGVsLCB0cmFuc2l0aW9uKSB7XG4gICAgICAgIGVsLnN0eWxlLndlYmtpdFRyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICAgICAgICBlbC5zdHlsZS5Nb3pUcmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgICAgICAgZWwuc3R5bGUuT1RyYW5zaXRpb24gPSB0cmFuc2l0aW9uO1xuICAgICAgICBlbC5zdHlsZS50cmFuc2l0aW9uID0gdHJhbnNpdGlvbjtcbiAgICB9LFxuXG4gICAgdHJhbnNmb3JtOiBmdW5jdGlvbiAoZWwsIHRyYW5zZm9ybSkge1xuICAgICAgICBlbC5zdHlsZS53ZWJraXRUcmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICAgIGVsLnN0eWxlLk1velRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgICAgZWwuc3R5bGUuT1RyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICAgICAgZWwuc3R5bGUudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgIH0sXG5cbiAgICBjcmVhdGVFbGVtZW50OiBmdW5jdGlvbiAoaHRtbCkge1xuICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGRpdi5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICByZXR1cm4gZGl2LmZpcnN0Q2hpbGQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGVsZW1lbnQgd291bGQgYmUgc2VsZWN0ZWQgYnkgdGhlIHNwZWNpZmllZCBzZWxlY3RvciBzdHJpbmdcbiAgICAgKi9cbiAgICBtYXRjaGVzOiBmdW5jdGlvbiAoZWwsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBwID0gRWxlbWVudC5wcm90b3R5cGU7XG4gICAgXHR2YXIgZiA9IHAubWF0Y2hlcyB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IGZ1bmN0aW9uKHMpIHtcbiAgICBcdFx0cmV0dXJuIFtdLmluZGV4T2YuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHMpLCB0aGlzKSAhPT0gLTE7XG4gICAgXHR9O1xuICAgIFx0cmV0dXJuIGYuY2FsbChlbCwgc2VsZWN0b3IpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBkZWxlZ2F0aW9uXG4gICAgICogQHBhcmFtICB7RWxlbWVudH0gICAgZWwgICAgICAgICAgUGFyZW50IE5vZGVcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICAgICBldnRUeXBlXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSAgICAgc2VsZWN0b3JcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gICBjYWxsYmFja1xuICAgICAqIEByZXR1cm5cbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gKGVsLCBldnRUeXBlLCBzZWxlY3RvciwgY2FsbGJhY2spIHtcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihldnRUeXBlLCBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tYXRjaGVzKGV2dC50YXJnZXQsIHNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHdpbmRvdywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHZhbHVlIGZyb20gYXJyYXlcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgICAgICAgYXJyYXkuc3BsaWNlKGFycmF5LmluZGV4T2YoZWwpLCAxKTtcbiAgICB9LFxuXG4gICAgZXh0ZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBzcmM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNyYyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIG9ialtrZXldID0gc3JjW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoIC8gU3Vic2NyaWJlIFBhdHRlcm5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHB1YnN1Yjoge1xuICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9vYnNlcnZlcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vYnNlcnZlcnMgPSB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBpZiAoIShhIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY107XG5cbiAgICAgICAgICAgIGEuc3BsaWNlKGEuaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHVibGlzaDogZnVuY3Rpb24gKHRvcGljKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX29ic2VydmVycykge1xuICAgICAgICAgICAgICAgIHRoaXMuX29ic2VydmVycyA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10sXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIl19
