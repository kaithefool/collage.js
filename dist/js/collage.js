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
    media: []
};

function Collage (el, opts) {
    this.opts = util.extend({}, defaults, opts);
    this.el = el;

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

    img: function (file) {
        return new Img(file, {
            uploader: this.uploader
        });
    },

    onfile: function (file) {
        var img = this.img(file);

        if (this.list) {
            this.list.appendChild(img.el);
        }

        this.publish('onfile', img);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvcmVzaXplLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIEZpbGVVcGxvYWRlciA9IHJlcXVpcmUoJy4vbGliL0ZpbGVVcGxvYWRlci5qcycpLFxuICAgIEZpbGVEcm9wID0gcmVxdWlyZSgnLi9lbGVtZW50cy9GaWxlRHJvcC5qcycpLFxuICAgIEltZyA9IHJlcXVpcmUoJy4vZWxlbWVudHMvSW1nLmpzJyksXG4gICAgU29ydGFibGUgPSByZXF1aXJlKCcuL2VsZW1lbnRzL1NvcnRhYmxlLmpzJyksXG4gICAgdXRpbCA9IHJlcXVpcmUoJy4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsYWdlO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgdXBsb2FkZXI6IG51bGwsXG4gICAgZmlsZURyb3A6IHt9LFxuICAgIHNvcnRhYmxlOiB0cnVlLFxuICAgIG1lZGlhOiBbXVxufTtcblxuZnVuY3Rpb24gQ29sbGFnZSAoZWwsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuICAgIHRoaXMuZWwgPSBlbDtcblxuICAgIHZhciBmb3JtID0gZWwucXVlcnlTZWxlY3RvcignZm9ybScpO1xuICAgIGlmICh0aGlzLm9wdHMudXBsb2FkZXIpIHtcbiAgICAgICAgdGhpcy51cGxvYWRlciA9IG5ldyBGaWxlVXBsb2FkZXIodGhpcy5vcHRzLnVwbG9hZGVyKTtcbiAgICB9IGVsc2UgaWYgKGZvcm0pIHtcbiAgICAgICAgdGhpcy51cGxvYWRlciA9IG5ldyBGaWxlVXBsb2FkZXIoe1xuICAgICAgICAgICAgZm9ybTogZm9ybVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoZWwpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5maWxlRHJvcCkge1xuICAgICAgICAgICAgdGhpcy5maWxlZHJvcCA9IG5ldyBGaWxlRHJvcChlbCwgdGhpcy5vcHRzLmZpbGVEcm9wKTtcbiAgICAgICAgICAgIHRoaXMuZmlsZWRyb3Auc3Vic2NyaWJlKCdmaWxlJywgdGhpcy5vbmZpbGUuYmluZCh0aGlzKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5vcHRzLnNvcnRhYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QgPSBlbC5xdWVyeVNlbGVjdG9yKCcuY29sbGFnZS1saXN0Jyk7XG4gICAgICAgICAgICB0aGlzLnNvcnRhYmxlID0gbmV3IFNvcnRhYmxlKHRoaXMubGlzdCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbkNvbGxhZ2UucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdXBsb2FkZXI6IG51bGwsXG5cbiAgICBpbWc6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW1nKGZpbGUsIHtcbiAgICAgICAgICAgIHVwbG9hZGVyOiB0aGlzLnVwbG9hZGVyXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBvbmZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHZhciBpbWcgPSB0aGlzLmltZyhmaWxlKTtcblxuICAgICAgICBpZiAodGhpcy5saXN0KSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QuYXBwZW5kQ2hpbGQoaW1nLmVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHVibGlzaCgnb25maWxlJywgaW1nKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZURyb3A7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBtYXhzaXplOiAxMCxcbiAgICBmb3JtYXQ6ICdqcGU/Z3xwbmd8Z2lmJ1xufTtcblxuZnVuY3Rpb24gc3RvcEV2dCAoZXZ0KSB7XG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xufVxuXG5mdW5jdGlvbiBGaWxlRHJvcCAoZWwsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuICAgIHRoaXMuZWwgPSBlbDtcbiAgICB0aGlzLmlucHV0ID0gZWwucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImZpbGVcIl0nKTtcblxuICAgIC8vIGV2ZW50c1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIHRoaXMub25kcm9wLmJpbmQodGhpcykpO1xuICAgIHRoaXMuZWwuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgc3RvcEV2dCk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIHN0b3BFdnQpO1xuICAgIGlmICh0aGlzLmlucHV0KSB7XG4gICAgICAgIHRoaXMuaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5vbmRyb3AuYmluZCh0aGlzKSk7XG4gICAgfVxufVxuXG5GaWxlRHJvcC5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgdmFyIHNpemUgPSBmaWxlLnNpemUgLyAoMTAwMDAwMCkgPD0gdGhpcy5vcHRzLm1heHNpemUsXG4gICAgICAgICAgICBmb3JtYXQgPSBmaWxlLm5hbWUubWF0Y2goJ1xcLignICsgdGhpcy5vcHRzLmZvcm1hdCArICcpJCcpO1xuXG4gICAgICAgIHJldHVybiBzaXplICYmIGZvcm1hdDtcbiAgICB9LFxuXG4gICAgb25kcmFnOiBmdW5jdGlvbiAoKSB7XG5cbiAgICB9LFxuXG4gICAgb25kcm9wOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIC8vIGdldCBmaWxlc1xuICAgICAgICB2YXIgZmlsZXMgPSBldnQuY3VycmVudFRhcmdldC5maWxlcyA/IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzIDogZXZ0LmRhdGFUcmFuc2Zlci5maWxlcztcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyByZXN0cmljdCBmaWxlcyBwZXIgZHJvcFxuICAgICAgICAgICAgaWYgKGkgPiAyMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGVzdCA9IHRoaXMudmFsaWRhdGUoZmlsZXNbaV0pO1xuICAgICAgICAgICAgaWYgKHRlc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1Ymxpc2goJ2ZpbGUnLCBmaWxlc1tpXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaCgnaW52YWxpZCcsIGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKSxcbiAgICByZXNpemUgPSByZXF1aXJlKCcuLy4uL2xpYi9yZXNpemUuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbWc7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cGxvYWRlcjogbnVsbCxcbiAgICB1cmw6IG51bGwsXG4gICAgcGFyYW1zOiBudWxsLFxuICAgIHNyYzogbnVsbFxufTtcblxuZnVuY3Rpb24gSW1nIChmaWxlLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcbiAgICB0aGlzLmZpbGUgPSBmaWxlO1xuICAgIHRoaXMuc2V0RWwoKTtcbiAgICB0aGlzLnJlYWRGaWxlKGZpbGUpO1xuXG4gICAgaWYgKHRoaXMub3B0cy51cGxvYWRlcikge1xuICAgICAgICB0aGlzLnVwbG9hZCgpO1xuICAgIH1cbn1cblxuSW1nLnByb3RvdHlwZSA9IHtcblxuICAgIHNldEVsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSA9ICdjb2xsYWdlLWltZyc7XG5cbiAgICAgICAgLy8gcHJvZ3Jlc3NcbiAgICAgICAgaWYgKHRoaXMub3B0cy51cGxvYWRlcikge1xuICAgICAgICAgICAgdGhpcy5lbC5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cImNvbGxhZ2UtcHJvZ3Jlc3NcIj48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtYmFyXCI+PC9kaXY+PGRpdiBjbGFzcz1cInByb2dyZXNzLXRleHRcIj48L2Rpdj48L2Rpdj4nO1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLmNvbGxhZ2UtcHJvZ3Jlc3MnKTtcbiAgICAgICAgICAgIHRoaXMuYmFyID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcucHJvZ3Jlc3MtYmFyJyk7XG4gICAgICAgICAgICB0aGlzLnRleHQgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5wcm9ncmVzcy10ZXh0Jyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVhZEZpbGU6IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSB0aGlzLm9ucmVhZC5iaW5kKHRoaXMpO1xuICAgICAgICByZWFkZXIub25lcnIgPSB0aGlzLm9uZXJyLmJpbmQodGhpcyk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH0sXG5cbiAgICBvbnJlYWQ6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIHNyYyA9IHJlc2l6ZShldnQudGFyZ2V0LnJlc3VsdCwgNTAwLCA1MDApO1xuXG4gICAgICAgIHRoaXMuc2V0Qmcoc3JjKTtcbiAgICB9LFxuXG4gICAgb25lcnI6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBzZXRCZzogZnVuY3Rpb24gKHVybCkge1xuICAgICAgICB0aGlzLmVsLnN0eWxlID0gJ2JhY2tncm91bmQtaW1hZ2U6IHVybCgnICsgdXJsICsgJyknO1xuICAgIH0sXG5cbiAgICBzZXRQcm9ncmVzczogZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIHByb2dyZXNzID0gTWF0aC5yb3VuZChwcm9ncmVzcyAqIDEwMCk7XG4gICAgICAgIHRoaXMuYmFyLnN0eWxlID0gJ3dpZHRoOiAnICsgcHJvZ3Jlc3MgKyAnJSc7XG4gICAgICAgIHRoaXMudGV4dC5pbm5lckhUTUwgPSBwcm9ncmVzcyArICclJztcbiAgICB9LFxuXG4gICAgdXBsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0YXNrID0gdGhpcy5vcHRzLnVwbG9hZGVyLnVwbG9hZCh0aGlzLmZpbGUsIHRoaXMub3B0cy51cmwsIHRoaXMub3B0cy5wYXJhbXMpO1xuXG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdzdWNjZXNzJywgdGhpcy5vbnN1Y2Nlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdwcm9ncmVzcycsIHRoaXMub25wcm9ncmVzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ2ZhaWwnLCB0aGlzLm9uZmFpbC5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAodGFzaywgcmVzKSB7XG4gICAgICAgIHRoaXMuc2V0QmcocmVzKTtcbiAgICAgICAgdGhpcy5wcm9ncmVzcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMucHJvZ3Jlc3MpO1xuICAgIH0sXG5cbiAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAodGFzaywgcHJvZ3Jlc3MpIHtcbiAgICAgICAgdGhpcy5zZXRQcm9ncmVzcyhwcm9ncmVzcyk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRleHQuaW5uZXJIVE1MID0gJ1VwbG9hZCBGYWlsZWQnO1xuICAgIH1cblxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuLy4uL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU29ydGFibGU7XG5cbmZ1bmN0aW9uIHN3YXAgKGVsMCwgZWwxKSB7XG4gICAgdmFyIGVsME5leHQgPSBlbDAubmV4dFNpYmxpbmcsXG4gICAgICAgIGVsMU5leHQgPSBlbDEubmV4dFNpYmxpbmc7XG5cbiAgICBlbDAucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwwLCBlbDFOZXh0KTtcbiAgICBlbDEucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwxLCBlbDBOZXh0KTtcbn1cblxuZnVuY3Rpb24gU29ydGFibGUgKGVsLCBzZWxlY3Rvcikge1xuICAgIHRoaXMuc2VsZWN0b3IgPSBzZWxlY3RvciA/IHNlbGVjdG9yIDogJy5jb2xsYWdlLWltZyc7XG5cbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9ubW91c2Vkb3duLmJpbmQodGhpcykpO1xuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25tb3VzZW1vdmUuYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25tb3VzZXVwLmJpbmQodGhpcykpO1xuXG4gICAgZWwuY2xhc3NOYW1lICs9ICdjb2xsYWdlLXNvcnRhYmxlJztcbn1cblxuU29ydGFibGUucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdGFyZ2V0OiBudWxsLFxuXG4gICAgb25tb3VzZWRvd246IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgaWYgKHV0aWwubWF0Y2hlcyhldnQudGFyZ2V0LCB0aGlzLnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBldnQudGFyZ2V0O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9ubW91c2Vtb3ZlOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGlmICghdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1dGlsLm1hdGNoZXMoZXZ0LnRhcmdldCwgdGhpcy5zZWxlY3RvcikgJiYgZXZ0LnRhcmdldCAhPT0gdGhpcy50YXJnZXQpIHtcbiAgICAgICAgICAgIHN3YXAoZXZ0LnRhcmdldCwgdGhpcy50YXJnZXQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9ubW91c2V1cDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRhcmdldCA9IG51bGw7XG4gICAgfSxcblxuICAgIHN3YXA6IGZ1bmN0aW9uIChlbDAsIGVsMSkge1xuICAgICAgICBcbiAgICB9LFxuXG4gICAgb246IGZ1bmN0aW9uICgpIHt9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFVwbG9hZFRhc2sgPSByZXF1aXJlKCcuL1VwbG9hZFRhc2snKSxcbiAgICB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZVVwbG9hZGVyO1xuXG52YXIgZGVmYXVsdHMgPSB7XG4gICAgdXJsOiBudWxsLFxuICAgIHBhcmFtczogbnVsbCxcbiAgICBmb3JtOiBudWxsXG59O1xuXG5mdW5jdGlvbiBGaWxlVXBsb2FkZXIgKG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xufVxuXG5GaWxlVXBsb2FkZXIucHJvdG90eXBlID0ge1xuXG4gICAgcGFyYWxsZWw6IDMsXG5cbiAgICB0aW1lb3V0UmV0cnk6IDIsXG5cbiAgICBxdWV1ZTogW10sXG5cbiAgICBwcm9jZXNzaW5nOiBbXSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKGZpbGUsIHVybCwgcGFyYW1zKSB7XG4gICAgICAgIHVybCA9IHVybCA/IHVybCA6ICh0aGlzLm9wdHMudXJsID8gdGhpcy5vcHRzLnVybCA6IHRoaXMub3B0cy5mb3JtLmFjdGlvbik7XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcyA/IHBhcmFtcyA6IHRoaXMub3B0cy5wYXJhbXM7XG5cbiAgICAgICAgdmFyIHRhc2sgPSBuZXcgVXBsb2FkVGFzayh1cmwsIHRoaXMuZ2V0Rm9ybURhdGEoZmlsZSwgcGFyYW1zKSk7XG5cbiAgICAgICAgLy8gY2FsbGJhY2tzXG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdzdWNjZXNzJywgdGhpcy5vbnN1Y2Nlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCd0aW1lb3V0JywgdGhpcy5vbnRpbWVvdXQuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvY2Vzc2luZy5sZW5ndGggPj0gdGhpcy5wYXJhbGxlbCkge1xuICAgICAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKHRhc2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ydW4odGFzayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFzaztcbiAgICB9LFxuXG4gICAgZ2V0Rm9ybURhdGE6IGZ1bmN0aW9uIChmaWxlLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEodGhpcy5vcHRzLmZvcm0pO1xuXG4gICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgZmlsZSk7XG4gICAgICAgIGlmIChwYXJhbXMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgcGFyYW1zLmZvckVhY2goZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgZGF0YS5hcHBlbmQoaW5wdXQubmFtZSwgaW5wdXQudmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuXG4gICAgcnVuOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLnByb2Nlc3NpbmcucHVzaCh0YXNrKTtcbiAgICAgICAgdGFzay5zdWJtaXQoKTtcbiAgICB9LFxuXG4gICAgZG9uZTogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdXRpbC5yZW1vdmUodGhpcy5wcm9jZXNzaW5nLCB0YXNrKTtcblxuICAgICAgICAvLyBydW4gbmV4dCB0YXNrXG4gICAgICAgIGlmICh0aGlzLnF1ZXVlLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICB2YXIgbmV4dCA9IHRoaXMucXVldWVbMF07XG5cbiAgICAgICAgICAgIHRoaXMucnVuKG5leHQpO1xuICAgICAgICAgICAgdXRpbC5yZW1vdmUodGhpcy5xdWV1ZSwgbmV4dCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25zdWNjZXNzOiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0aGlzLmRvbmUodGFzayk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5kb25lKHRhc2spO1xuICAgIH0sXG5cbiAgICBvbnRpbWVvdXQ6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIGlmICh0YXNrLnRpbWVvdXRzID4gdGhpcy50aW1lb3V0UmV0cnkpIHtcbiAgICAgICAgICAgIHRhc2sub25mYWlsKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBzdWJtaXQgYWdhaW5cbiAgICAgICAgICAgIHRhc2suc3VibWl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXBsb2FkVGFzaztcblxuZnVuY3Rpb24gVXBsb2FkVGFzayAodXJsLCBmb3JtRGF0YSkge1xuICAgIHRoaXMudXJsID0gdXJsO1xuICAgIHRoaXMuZm9ybURhdGEgPSBmb3JtRGF0YTtcbn1cblxuVXBsb2FkVGFzay5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB0aW1lb3V0czogMCxcblxuICAgIHN1Ym1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeGhyID0gdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAvLyBldmVudCBoYW5kbGVyc1xuICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSB0aGlzLm9ucHJvZ3Jlc3MuYmluZCh0aGlzKTtcbiAgICAgICAgeGhyLm9udGltZW91dCA9IHRoaXMub250aW1lb3V0LmJpbmQodGhpcyk7XG4gICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25zdWNjZXNzKHhocik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh4aHIuc3RhdHVzICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25mYWlsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgLy8gc2VuZCB0aGUgcmVxdWVzdFxuICAgICAgICB4aHIudGltZW91dCA9ICgxMDAwICogNjApO1xuICAgICAgICB4aHIub3BlbigncG9zdCcsIHRoaXMudXJsKTtcbiAgICAgICAgeGhyLnNlbmQodGhpcy5mb3JtRGF0YSk7XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHhocikge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3N1Y2Nlc3MnLCB0aGlzLCB4aHIucmVzcG9uc2VUZXh0LCB4aHIuc3RhdHVzKTtcbiAgICB9LFxuXG4gICAgb25wcm9ncmVzczogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3Byb2dyZXNzJywgdGhpcywgZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCk7XG4gICAgfSxcblxuICAgIG9udGltZW91dDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRpbWVvdXRzICsrO1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ3RpbWVvdXQnLCB0aGlzKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucHVibGlzaCgnZmFpbCcsIHRoaXMpO1xuICAgIH1cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiByZXNpemUgKHNyYywgd2lkdGgsIGhlaWdodCkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKSxcbiAgICAgICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyksXG4gICAgICAgIGltZyA9IG5ldyBJbWFnZSgpO1xuXG4gICAgaW1nLnNyYyA9IHNyYztcbiAgICB2YXIgZGltZW5zaW9uID0gc2NhbGUoaW1nLCB7d2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodH0pO1xuICAgIGNhbnZhcy53aWR0aCA9IGRpbWVuc2lvbi53aWR0aDtcbiAgICBjYW52YXMuaGVpZ2h0ID0gZGltZW5zaW9uLmhlaWdodDtcbiAgICBjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgZGltZW5zaW9uLndpZHRoLCBkaW1lbnNpb24uaGVpZ2h0KTtcblxuICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcbn1cblxuZnVuY3Rpb24gc2NhbGUgKGltZywgbWF4KSB7XG4gICAgdmFyIGltZ0FSID0gaW1nLmhlaWdodCAvIGltZy53aWR0aCxcbiAgICAgICAgbWF4QVIsXG4gICAgICAgIHNjYWxlV2l0aFdpZHRoID0gZmFsc2U7XG5cbiAgICBpZiAoIW1heC5oZWlnaHQpIHtcbiAgICAgICAgc2NhbGVXaXRoV2lkdGggPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobWF4LndpZHRoICYmIG1heC5oZWlnaHQpIHtcbiAgICAgICAgbWF4QVIgPSBtYXguaGVpZ2h0IC8gbWF4LndpZHRoO1xuICAgICAgICBpZiAobWF4QVIgPiBpbWdBUikge1xuICAgICAgICAgICAgc2NhbGVXaXRoV2lkdGggPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHNjYWxlV2l0aFdpZHRoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogbWF4LndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBtYXgud2lkdGggKiBpbWdBUlxuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogbWF4LmhlaWdodCAvIGltZ0FSLFxuICAgICAgICAgICAgaGVpZ2h0OiBtYXguaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlc2l6ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiBlbGVtZW50IHdvdWxkIGJlIHNlbGVjdGVkIGJ5IHRoZSBzcGVjaWZpZWQgc2VsZWN0b3Igc3RyaW5nXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBlbCAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBzZWxlY3RvciBbZGVzY3JpcHRpb25dXG4gICAgICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgbWF0Y2hlczogZnVuY3Rpb24gKGVsLCBzZWxlY3Rvcikge1xuICAgICAgICB2YXIgcCA9IEVsZW1lbnQucHJvdG90eXBlO1xuICAgIFx0dmFyIGYgPSBwLm1hdGNoZXMgfHwgcC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgcC5tb3pNYXRjaGVzU2VsZWN0b3IgfHwgcC5tc01hdGNoZXNTZWxlY3RvciB8fCBmdW5jdGlvbihzKSB7XG4gICAgXHRcdHJldHVybiBbXS5pbmRleE9mLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzKSwgdGhpcykgIT09IC0xO1xuICAgIFx0fTtcbiAgICBcdHJldHVybiBmLmNhbGwoZWwsIHNlbGVjdG9yKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHZhbHVlIGZyb20gYXJyYXlcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgICAgICAgYXJyYXkuc3BsaWNlKGFycmF5LmluZGV4T2YoZWwpLCAxKTtcbiAgICB9LFxuXG4gICAgZXh0ZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbMF0sXG4gICAgICAgICAgICBzcmM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNyYyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIG9ialtrZXldID0gc3JjW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQdWJsaXNoIC8gU3Vic2NyaWJlIFBhdHRlcm5cbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHB1YnN1Yjoge1xuICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uICh0b3BpYywgaGFuZGxlcikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9vYnNlcnZlcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vYnNlcnZlcnMgPSB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGEgPSB0aGlzLl9vYnNlcnZlcnNbdG9waWNdO1xuXG4gICAgICAgICAgICBpZiAoIShhIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGEucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1bnN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY107XG5cbiAgICAgICAgICAgIGEuc3BsaWNlKGEuaW5kZXhPZihoYW5kbGVyKSwgMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHVibGlzaDogZnVuY3Rpb24gKHRvcGljKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY10sXG4gICAgICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgICAgIGlmIChhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIl19
