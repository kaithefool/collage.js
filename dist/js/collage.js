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

Collage.prototype = {

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
    },

    getImg: function (src) {
        return new Img(src, {
            uploader: this.uploader
        });
    },

    onfile: function (file) {
        this._add(file);
    }

};

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

    if (src instanceof File) {
        // if file is provided as source
        this.file = src;
        this.setEl();
        this.readFile(src);

        if (this.opts.uploader) {
            this.upload();
        }
    } else {
        // url as source
        this.setBg(src);
    }
}

Img.prototype = {

    setEl: function () {
        this.el = document.createElement('div');

        this.el.className = 'collage-img';

        // progress
        if (this.opts.uploader) {
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
    this.selector = selector ? selector : '.collage-img';

    el.addEventListener('mousedown', this.onmousedown.bind(this));
    el.addEventListener('mousemove', this.onmousemove.bind(this));
    el.addEventListener('mouseup', this.onmouseup.bind(this));

    el.className += 'collage-sortable';
}

Sortable.prototype = util.extend({

    target: null,

    onmousedown: function (evt) {
        if (util.matches(evt.target, this.selector)) {
            this.target = evt.target;
        }
    },

    onmousemove: function (evt) {
        if (!this.target) {
            return;
        }

        if (util.matches(evt.target, this.selector) && evt.target !== this.target) {
            swap(evt.target, this.target);
        }
    },

    onmouseup: function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvcmVzaXplLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBGaWxlVXBsb2FkZXIgPSByZXF1aXJlKCcuL2xpYi9GaWxlVXBsb2FkZXIuanMnKSxcbiAgICBGaWxlRHJvcCA9IHJlcXVpcmUoJy4vZWxlbWVudHMvRmlsZURyb3AuanMnKSxcbiAgICBJbWcgPSByZXF1aXJlKCcuL2VsZW1lbnRzL0ltZy5qcycpLFxuICAgIFNvcnRhYmxlID0gcmVxdWlyZSgnLi9lbGVtZW50cy9Tb3J0YWJsZS5qcycpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGFnZTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIGZpbGVEcm9wOiB7fSxcbiAgICBzb3J0YWJsZTogdHJ1ZVxufTtcblxuZnVuY3Rpb24gQ29sbGFnZSAoZWwsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuXG4gICAgLy8gc2V0dXAgdXBsb2FkZXJcbiAgICBpZiAodGhpcy5vcHRzLnVwbG9hZGVyKSB7XG4gICAgICAgIHRoaXMudXBsb2FkZXIgPSBuZXcgRmlsZVVwbG9hZGVyKHRoaXMub3B0cy51cGxvYWRlcik7XG4gICAgfVxuXG4gICAgaWYgKGVsKSB7XG4gICAgICAgIHRoaXMubGlzdCA9IGVsLnF1ZXJ5U2VsZWN0b3IoJy5jb2xsYWdlLWxpc3QnKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRzLmZpbGVEcm9wKSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVkcm9wID0gbmV3IEZpbGVEcm9wKGVsLCB0aGlzLm9wdHMuZmlsZURyb3ApO1xuICAgICAgICAgICAgdGhpcy5maWxlZHJvcC5zdWJzY3JpYmUoJ2ZpbGUnLCB0aGlzLm9uZmlsZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdHMuc29ydGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuc29ydGFibGUgPSBuZXcgU29ydGFibGUodGhpcy5saXN0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuQ29sbGFnZS5wcm90b3R5cGUgPSB7XG5cbiAgICB1cGxvYWRlcjogbnVsbCxcblxuICAgIGFkZDogZnVuY3Rpb24gKGl0ZW1zKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW1zKSkge1xuICAgICAgICAgICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZChpdGVtKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2FkZDogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdmFyIGltZyA9IHRoaXMuZ2V0SW1nKGl0ZW0pO1xuXG4gICAgICAgIHRoaXMubGlzdC5hcHBlbmRDaGlsZChpbWcuZWwpO1xuICAgIH0sXG5cbiAgICBnZXRJbWc6IGZ1bmN0aW9uIChzcmMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbWcoc3JjLCB7XG4gICAgICAgICAgICB1cGxvYWRlcjogdGhpcy51cGxvYWRlclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25maWxlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB0aGlzLl9hZGQoZmlsZSk7XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlRHJvcDtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIG1heHNpemU6IDEwLFxuICAgIGZvcm1hdDogJ2pwZT9nfHBuZ3xnaWYnXG59O1xuXG5mdW5jdGlvbiBzdG9wRXZ0IChldnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5cbmZ1bmN0aW9uIEZpbGVEcm9wIChlbCwgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG4gICAgdGhpcy5lbCA9IGVsO1xuICAgIHRoaXMuaW5wdXQgPSBlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xuXG4gICAgLy8gZXZlbnRzXG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5vbmRyb3AuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBzdG9wRXZ0KTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgc3RvcEV2dCk7XG4gICAgaWYgKHRoaXMuaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLm9uZHJvcC5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbkZpbGVEcm9wLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZSAvICgxMDAwMDAwKSA8PSB0aGlzLm9wdHMubWF4c2l6ZSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGZpbGUubmFtZS5tYXRjaCgnXFwuKCcgKyB0aGlzLm9wdHMuZm9ybWF0ICsgJykkJyk7XG5cbiAgICAgICAgcmV0dXJuIHNpemUgJiYgZm9ybWF0O1xuICAgIH0sXG5cbiAgICBvbmRyYWc6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBvbmRyb3A6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gZ2V0IGZpbGVzXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzID8gZXZ0LmN1cnJlbnRUYXJnZXQuZmlsZXMgOiBldnQuZGF0YVRyYW5zZmVyLmZpbGVzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIHJlc3RyaWN0IGZpbGVzIHBlciBkcm9wXG4gICAgICAgICAgICBpZiAoaSA+IDIwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB0ZXN0ID0gdGhpcy52YWxpZGF0ZShmaWxlc1tpXSk7XG4gICAgICAgICAgICBpZiAodGVzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaCgnZmlsZScsIGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJsaXNoKCdpbnZhbGlkJywgZmlsZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpLFxuICAgIHJlc2l6ZSA9IHJlcXVpcmUoJy4vLi4vbGliL3Jlc2l6ZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltZztcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIHVybDogbnVsbCxcbiAgICBwYXJhbXM6IG51bGxcbn07XG5cbmZ1bmN0aW9uIEltZyAoc3JjLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcblxuICAgIGlmIChzcmMgaW5zdGFuY2VvZiBGaWxlKSB7XG4gICAgICAgIC8vIGlmIGZpbGUgaXMgcHJvdmlkZWQgYXMgc291cmNlXG4gICAgICAgIHRoaXMuZmlsZSA9IHNyYztcbiAgICAgICAgdGhpcy5zZXRFbCgpO1xuICAgICAgICB0aGlzLnJlYWRGaWxlKHNyYyk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0cy51cGxvYWRlcikge1xuICAgICAgICAgICAgdGhpcy51cGxvYWQoKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHVybCBhcyBzb3VyY2VcbiAgICAgICAgdGhpcy5zZXRCZyhzcmMpO1xuICAgIH1cbn1cblxuSW1nLnByb3RvdHlwZSA9IHtcblxuICAgIHNldEVsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSA9ICdjb2xsYWdlLWltZyc7XG5cbiAgICAgICAgLy8gcHJvZ3Jlc3NcbiAgICAgICAgaWYgKHRoaXMub3B0cy51cGxvYWRlcikge1xuICAgICAgICAgICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cImNvbGxhZ2UtcHJvZ3Jlc3NcIj48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtYmFyXCI+PC9kaXY+PGRpdiBjbGFzcz1cInByb2dyZXNzLXRleHRcIj48L2Rpdj48L2Rpdj4nO1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLmNvbGxhZ2UtcHJvZ3Jlc3MnKTtcbiAgICAgICAgICAgIHRoaXMuYmFyID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcucHJvZ3Jlc3MtYmFyJyk7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5wcm9ncmVzcy10ZXh0Jyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVhZEZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSB0aGlzLm9ucmVhZC5iaW5kKHRoaXMpO1xuICAgICAgICByZWFkZXIub25lcnIgPSB0aGlzLm9uZXJyLmJpbmQodGhpcyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH0sXG5cbiAgICBvbnJlYWQ6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIHNyYyA9IHJlc2l6ZShldnQudGFyZ2V0LnJlc3VsdCwgNTAwLCA1MDApO1xuXG4gICAgICAgIHRoaXMuc2V0Qmcoc3JjKTtcbiAgICB9LFxuXG4gICAgb25lcnI6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBzZXRCZzogZnVuY3Rpb24gKHNyYykge1xuICAgICAgICB0aGlzLmVsLnN0eWxlID0gJ2JhY2tncm91bmQtaW1hZ2U6IHVybCgnICsgc3JjICsgJyknO1xuICAgIH0sXG5cbiAgICBzZXRQcm9ncmVzczogZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIHByb2dyZXNzID0gTWF0aC5yb3VuZChwcm9ncmVzcyAqIDEwMCk7XG4gICAgICAgIHRoaXMuYmFyLnN0eWxlID0gJ3dpZHRoOiAnICsgcHJvZ3Jlc3MgKyAnJSc7XG4gICAgICAgIHRoaXMudGV4dC5pbm5lckhUTUwgPSBwcm9ncmVzcyArICclJztcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0YXNrID0gdGhpcy5vcHRzLnVwbG9hZGVyLnVwbG9hZCh0aGlzLmZpbGUsIHRoaXMub3B0cy51cmwsIHRoaXMub3B0cy5wYXJhbXMpO1xuXG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdzdWNjZXNzJywgdGhpcy5vbnN1Y2Nlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdwcm9ncmVzcycsIHRoaXMub25wcm9ncmVzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ2ZhaWwnLCB0aGlzLm9uZmFpbC5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAodGFzaywgcmVzKSB7XG4gICAgICAgIHRoaXMuc2V0QmcocmVzKTtcbiAgICAgICAgdGhpcy5wcm9ncmVzcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMucHJvZ3Jlc3MpO1xuICAgIH0sXG5cbiAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAodGFzaywgcHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5zZXRQcm9ncmVzcyhwcm9ncmVzcyk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gJ1VwbG9hZCBGYWlsZWQnO1xuICAgIH1cblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU29ydGFibGU7XG5cbmZ1bmN0aW9uIHN3YXAgKGVsMCwgZWwxKSB7XG4gICAgdmFyIGVsME5leHQgPSBlbDAubmV4dFNpYmxpbmcsXG4gICAgICAgIGVsMU5leHQgPSBlbDEubmV4dFNpYmxpbmc7XG5cbiAgICBlbDAucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwwLCBlbDFOZXh0KTtcbiAgICBlbDEucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwxLCBlbDBOZXh0KTtcbn1cblxuZnVuY3Rpb24gU29ydGFibGUgKGVsLCBzZWxlY3Rvcikge1xuICAgIHRoaXMuc2VsZWN0b3IgPSBzZWxlY3RvciA/IHNlbGVjdG9yIDogJy5jb2xsYWdlLWltZyc7XG5cbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9ubW91c2Vkb3duLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25tb3VzZW1vdmUuYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25tb3VzZXVwLmJpbmQodGhpcykpO1xuXG4gICAgZWwuY2xhc3NOYW1lICs9ICdjb2xsYWdlLXNvcnRhYmxlJztcbn1cblxuU29ydGFibGUucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdGFyZ2V0OiBudWxsLFxuXG4gICAgb25tb3VzZWRvd246IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgaWYgKHV0aWwubWF0Y2hlcyhldnQudGFyZ2V0LCB0aGlzLnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBldnQudGFyZ2V0O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9ubW91c2Vtb3ZlOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlsLm1hdGNoZXMoZXZ0LnRhcmdldCwgdGhpcy5zZWxlY3RvcikgJiYgZXZ0LnRhcmdldCAhPT0gdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHN3YXAoZXZ0LnRhcmdldCwgdGhpcy50YXJnZXQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9ubW91c2V1cDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRhcmdldCA9IG51bGw7XG4gICAgfSxcblxuICAgIHN3YXA6IGZ1bmN0aW9uIChlbDAsIGVsMSkge1xuICAgICAgICBcbiAgICB9LFxuXG4gICAgb246IGZ1bmN0aW9uICgpIHt9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFVwbG9hZFRhc2sgPSByZXF1aXJlKCcuL1VwbG9hZFRhc2snKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZVVwbG9hZGVyO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgdXJsOiBudWxsLFxuICAgIHBhcmFtczogbnVsbFxufTtcblxuZnVuY3Rpb24gRmlsZVVwbG9hZGVyIChvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbn1cblxuRmlsZVVwbG9hZGVyLnByb3RvdHlwZSA9IHtcblxuICAgIHBhcmFsbGVsOiAzLFxuXG4gICAgdGltZW91dFJldHJ5OiAyLFxuXG4gICAgcXVldWU6IFtdLFxuXG4gICAgcHJvY2Vzc2luZzogW10sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uIChmaWxlLCB1cmwsIHBhcmFtcykge1xuICAgICAgICB1cmwgPSB1cmwgPyB1cmwgOiB0aGlzLm9wdHMudXJsO1xuICAgICAgICBwYXJhbXMgPSBwYXJhbXMgPyBwYXJhbXMgOiB0aGlzLm9wdHMucGFyYW1zO1xuXG4gICAgICAgIHZhciB0YXNrID0gbmV3IFVwbG9hZFRhc2sodXJsLCB0aGlzLmdldEZvcm1EYXRhKGZpbGUsIHBhcmFtcykpO1xuXG4gICAgICAgIC8vIGNhbGxiYWNrc1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnc3VjY2VzcycsIHRoaXMub25zdWNjZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnZmFpbCcsIHRoaXMub25mYWlsLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgndGltZW91dCcsIHRoaXMub250aW1lb3V0LmJpbmQodGhpcykpO1xuXG4gICAgICAgIGlmICh0aGlzLnByb2Nlc3NpbmcubGVuZ3RoID49IHRoaXMucGFyYWxsZWwpIHtcbiAgICAgICAgICAgIHRoaXMucXVldWUucHVzaCh0YXNrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucnVuKHRhc2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhc2s7XG4gICAgfSxcblxuICAgIGdldEZvcm1EYXRhOiBmdW5jdGlvbiAoZmlsZSwgcGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cbiAgICAgICAgZGF0YS5hcHBlbmQoJ2ZpbGUnLCBmaWxlKTtcbiAgICAgICAgaWYgKHBhcmFtcyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBwYXJhbXMuZm9yRWFjaChmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBkYXRhLmFwcGVuZChpbnB1dC5uYW1lLCBpbnB1dC52YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG5cbiAgICBydW46IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMucHJvY2Vzc2luZy5wdXNoKHRhc2spO1xuICAgICAgICB0YXNrLnN1Ym1pdCgpO1xuICAgIH0sXG5cbiAgICBkb25lOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB1dGlsLnJlbW92ZSh0aGlzLnByb2Nlc3NpbmcsIHRhc2spO1xuXG4gICAgICAgIC8vIHJ1biBuZXh0IHRhc2tcbiAgICAgICAgaWYgKHRoaXMucXVldWUubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIHZhciBuZXh0ID0gdGhpcy5xdWV1ZVswXTtcblxuICAgICAgICAgICAgdGhpcy5ydW4obmV4dCk7XG4gICAgICAgICAgICB1dGlsLnJlbW92ZSh0aGlzLnF1ZXVlLCBuZXh0KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMuZG9uZSh0YXNrKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLmRvbmUodGFzayk7XG4gICAgfSxcblxuICAgIG9udGltZW91dDogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgaWYgKHRhc2sudGltZW91dHMgPiB0aGlzLnRpbWVvdXRSZXRyeSkge1xuICAgICAgICAgICAgdGFzay5vbmZhaWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHN1Ym1pdCBhZ2FpblxuICAgICAgICAgICAgdGFzay5zdWJtaXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcGxvYWRUYXNrO1xuXG5mdW5jdGlvbiBVcGxvYWRUYXNrICh1cmwsIGZvcm1EYXRhKSB7XG4gICAgdGhpcy51cmwgPSB1cmw7XG4gICAgdGhpcy5mb3JtRGF0YSA9IGZvcm1EYXRhO1xufVxuXG5VcGxvYWRUYXNrLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHRpbWVvdXRzOiAwLFxuXG4gICAgc3VibWl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4aHIgPSB0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgIC8vIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IHRoaXMub25wcm9ncmVzcy5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIub250aW1lb3V0ID0gdGhpcy5vbnRpbWVvdXQuYmluZCh0aGlzKTtcbiAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbnN1Y2Nlc3MoeGhyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHhoci5zdGF0dXMgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmZhaWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICAvLyBzZW5kIHRoZSByZXF1ZXN0XG4gICAgICAgIHhoci50aW1lb3V0ID0gKDEwMDAgKiA2MCk7XG4gICAgICAgIHhoci5vcGVuKCdwb3N0JywgdGhpcy51cmwpO1xuICAgICAgICB4aHIuc2VuZCh0aGlzLmZvcm1EYXRhKTtcbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAoeGhyKSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgnc3VjY2VzcycsIHRoaXMsIHhoci5yZXNwb25zZVRleHQsIHhoci5zdGF0dXMpO1xuICAgIH0sXG5cbiAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgncHJvZ3Jlc3MnLCB0aGlzLCBldnQubG9hZGVkIC8gZXZ0LnRvdGFsKTtcbiAgICB9LFxuXG4gICAgb250aW1lb3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGltZW91dHMgKys7XG4gICAgICAgIHRoaXMucHVibGlzaCgndGltZW91dCcsIHRoaXMpO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdmYWlsJywgdGhpcyk7XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIHJlc2l6ZSAoc3JjLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLFxuICAgICAgICBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSxcbiAgICAgICAgaW1nID0gbmV3IEltYWdlKCk7XG5cbiAgICBpbWcuc3JjID0gc3JjO1xuICAgIHZhciBkaW1lbnNpb24gPSBzY2FsZShpbWcsIHt3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0fSk7XG4gICAgY2FudmFzLndpZHRoID0gZGltZW5zaW9uLndpZHRoO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBkaW1lbnNpb24uaGVpZ2h0O1xuICAgIGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCBkaW1lbnNpb24ud2lkdGgsIGRpbWVuc2lvbi5oZWlnaHQpO1xuXG4gICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL2pwZWcnKTtcbn1cblxuZnVuY3Rpb24gc2NhbGUgKGltZywgbWF4KSB7XG4gICAgdmFyIGltZ0FSID0gaW1nLmhlaWdodCAvIGltZy53aWR0aCxcbiAgICAgICAgbWF4QVIsXG4gICAgICAgIHNjYWxlV2l0aFdpZHRoID0gZmFsc2U7XG5cbiAgICBpZiAoIW1heC5oZWlnaHQpIHtcbiAgICAgICAgc2NhbGVXaXRoV2lkdGggPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobWF4LndpZHRoICYmIG1heC5oZWlnaHQpIHtcbiAgICAgICAgbWF4QVIgPSBtYXguaGVpZ2h0IC8gbWF4LndpZHRoO1xuICAgICAgICBpZiAobWF4QVIgPiBpbWdBUikge1xuICAgICAgICAgICAgc2NhbGVXaXRoV2lkdGggPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNjYWxlV2l0aFdpZHRoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogbWF4LndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBtYXgud2lkdGggKiBpbWdBUlxuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogbWF4LmhlaWdodCAvIGltZ0FSLFxuICAgICAgICAgICAgaGVpZ2h0OiBtYXguaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlc2l6ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBlbGVtZW50IHdvdWxkIGJlIHNlbGVjdGVkIGJ5IHRoZSBzcGVjaWZpZWQgc2VsZWN0b3Igc3RyaW5nXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBlbCAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBzZWxlY3RvciBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgbWF0Y2hlczogZnVuY3Rpb24gKGVsLCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgcCA9IEVsZW1lbnQucHJvdG90eXBlO1xuICAgIFx0dmFyIGYgPSBwLm1hdGNoZXMgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBmdW5jdGlvbihzKSB7XG4gICAgXHRcdHJldHVybiBbXS5pbmRleE9mLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzKSwgdGhpcykgIT09IC0xO1xuICAgIFx0fTtcbiAgICBcdHJldHVybiBmLmNhbGwoZWwsIHNlbGVjdG9yKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHZhbHVlIGZyb20gYXJyYXlcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgICAgICAgYXJyYXkuc3BsaWNlKGFycmF5LmluZGV4T2YoZWwpLCAxKTtcbiAgICB9LFxuXG4gICAgZXh0ZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBzcmM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNyYyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIG9ialtrZXldID0gc3JjW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoIC8gU3Vic2NyaWJlIFBhdHRlcm5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHB1YnN1Yjoge1xuICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9vYnNlcnZlcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vYnNlcnZlcnMgPSB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBpZiAoIShhIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY107XG5cbiAgICAgICAgICAgIGEuc3BsaWNlKGEuaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHVibGlzaDogZnVuY3Rpb24gKHRvcGljKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10sXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIl19
