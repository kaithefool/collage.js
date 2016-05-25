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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvY29sbGFnZS5qcyIsInNyYy9qcy9lbGVtZW50cy9GaWxlRHJvcC5qcyIsInNyYy9qcy9lbGVtZW50cy9JbWcuanMiLCJzcmMvanMvZWxlbWVudHMvU29ydGFibGUuanMiLCJzcmMvanMvbGliL0ZpbGVVcGxvYWRlci5qcyIsInNyYy9qcy9saWIvVXBsb2FkVGFzay5qcyIsInNyYy9qcy9saWIvcmVzaXplLmpzIiwic3JjL2pzL2xpYi91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBGaWxlVXBsb2FkZXIgPSByZXF1aXJlKCcuL2xpYi9GaWxlVXBsb2FkZXIuanMnKSxcbiAgICBGaWxlRHJvcCA9IHJlcXVpcmUoJy4vZWxlbWVudHMvRmlsZURyb3AuanMnKSxcbiAgICBJbWcgPSByZXF1aXJlKCcuL2VsZW1lbnRzL0ltZy5qcycpLFxuICAgIFNvcnRhYmxlID0gcmVxdWlyZSgnLi9lbGVtZW50cy9Tb3J0YWJsZS5qcycpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL2xpYi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGFnZTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIGZpbGVEcm9wOiB7fSxcbiAgICBzb3J0YWJsZTogdHJ1ZSxcbiAgICBtZWRpYTogW11cbn07XG5cbmZ1bmN0aW9uIENvbGxhZ2UgKGVsLCBvcHRzKSB7XG4gICAgdGhpcy5vcHRzID0gdXRpbC5leHRlbmQoe30sIGRlZmF1bHRzLCBvcHRzKTtcblxuICAgIGlmICh0aGlzLm9wdHMudXBsb2FkZXIpIHtcbiAgICAgICAgdGhpcy51cGxvYWRlciA9IG5ldyBGaWxlVXBsb2FkZXIodGhpcy5vcHRzLnVwbG9hZGVyKTtcbiAgICB9XG5cbiAgICBpZiAoZWwpIHtcbiAgICAgICAgdGhpcy5saXN0ID0gZWwucXVlcnlTZWxlY3RvcignLmNvbGxhZ2UtbGlzdCcpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdHMuZmlsZURyb3ApIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZWRyb3AgPSBuZXcgRmlsZURyb3AoZWwsIHRoaXMub3B0cy5maWxlRHJvcCk7XG4gICAgICAgICAgICB0aGlzLmZpbGVkcm9wLnN1YnNjcmliZSgnZmlsZScsIHRoaXMub25maWxlLmJpbmQodGhpcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMub3B0cy5zb3J0YWJsZSkge1xuICAgICAgICAgICAgdGhpcy5zb3J0YWJsZSA9IG5ldyBTb3J0YWJsZSh0aGlzLmxpc3QpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5Db2xsYWdlLnByb3RvdHlwZSA9IHtcblxuICAgIHVwbG9hZGVyOiBudWxsLFxuXG4gICAgZ2V0SW1nOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICByZXR1cm4gbmV3IEltZyhmaWxlLCB7XG4gICAgICAgICAgICB1cGxvYWRlcjogdGhpcy51cGxvYWRlclxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgb25maWxlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgaW1nID0gdGhpcy5nZXRJbWcoZmlsZSk7XG5cbiAgICAgICAgdGhpcy5saXN0LmFwcGVuZENoaWxkKGltZy5lbCk7XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlRHJvcDtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIG1heHNpemU6IDEwLFxuICAgIGZvcm1hdDogJ2pwZT9nfHBuZ3xnaWYnXG59O1xuXG5mdW5jdGlvbiBzdG9wRXZ0IChldnQpIHtcbiAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5cbmZ1bmN0aW9uIEZpbGVEcm9wIChlbCwgb3B0cykge1xuICAgIHRoaXMub3B0cyA9IHV0aWwuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0cyk7XG4gICAgdGhpcy5lbCA9IGVsO1xuICAgIHRoaXMuaW5wdXQgPSBlbC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiZmlsZVwiXScpO1xuXG4gICAgLy8gZXZlbnRzXG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgdGhpcy5vbmRyb3AuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5lbC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBzdG9wRXZ0KTtcbiAgICB0aGlzLmVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgc3RvcEV2dCk7XG4gICAgaWYgKHRoaXMuaW5wdXQpIHtcbiAgICAgICAgdGhpcy5pbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLm9uZHJvcC5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG5cbkZpbGVEcm9wLnByb3RvdHlwZSA9IHV0aWwuZXh0ZW5kKHtcblxuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZSAvICgxMDAwMDAwKSA8PSB0aGlzLm9wdHMubWF4c2l6ZSxcbiAgICAgICAgICAgIGZvcm1hdCA9IGZpbGUubmFtZS5tYXRjaCgnXFwuKCcgKyB0aGlzLm9wdHMuZm9ybWF0ICsgJykkJyk7XG5cbiAgICAgICAgcmV0dXJuIHNpemUgJiYgZm9ybWF0O1xuICAgIH0sXG5cbiAgICBvbmRyYWc6IGZ1bmN0aW9uICgpIHtcblxuICAgIH0sXG5cbiAgICBvbmRyb3A6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gZ2V0IGZpbGVzXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC5jdXJyZW50VGFyZ2V0LmZpbGVzID8gZXZ0LmN1cnJlbnRUYXJnZXQuZmlsZXMgOiBldnQuZGF0YVRyYW5zZmVyLmZpbGVzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIC8vIHJlc3RyaWN0IGZpbGVzIHBlciBkcm9wXG4gICAgICAgICAgICBpZiAoaSA+IDIwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB0ZXN0ID0gdGhpcy52YWxpZGF0ZShmaWxlc1tpXSk7XG4gICAgICAgICAgICBpZiAodGVzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaCgnZmlsZScsIGZpbGVzW2ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJsaXNoKCdpbnZhbGlkJywgZmlsZXNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59LCB1dGlsLnB1YnN1Yik7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi8uLi9saWIvdXRpbC5qcycpLFxuICAgIHJlc2l6ZSA9IHJlcXVpcmUoJy4vLi4vbGliL3Jlc2l6ZS5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEltZztcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIHVwbG9hZGVyOiBudWxsLFxuICAgIHVybDogbnVsbCxcbiAgICBwYXJhbXM6IG51bGwsXG4gICAgc3JjOiBudWxsXG59O1xuXG5mdW5jdGlvbiBJbWcgKGZpbGUsIG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xuICAgIHRoaXMuZmlsZSA9IGZpbGU7XG4gICAgdGhpcy5zZXRFbCgpO1xuICAgIHRoaXMucmVhZEZpbGUoZmlsZSk7XG5cbiAgICBpZiAodGhpcy5vcHRzLnVwbG9hZGVyKSB7XG4gICAgICAgIHRoaXMudXBsb2FkKCk7XG4gICAgfVxufVxuXG5JbWcucHJvdG90eXBlID0ge1xuXG4gICAgc2V0RWw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIHRoaXMuZWwuY2xhc3NOYW1lID0gJ2NvbGxhZ2UtaW1nJztcblxuICAgICAgICAvLyBwcm9ncmVzc1xuICAgICAgICBpZiAodGhpcy5vcHRzLnVwbG9hZGVyKSB7XG4gICAgICAgICAgICB0aGlzLmVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwiY29sbGFnZS1wcm9ncmVzc1wiPjxkaXYgY2xhc3M9XCJwcm9ncmVzcy1iYXJcIj48L2Rpdj48ZGl2IGNsYXNzPVwicHJvZ3Jlc3MtdGV4dFwiPjwvZGl2PjwvZGl2Pic7XG4gICAgICAgICAgICB0aGlzLnByb2dyZXNzID0gdGhpcy5lbC5xdWVyeVNlbGVjdG9yKCcuY29sbGFnZS1wcm9ncmVzcycpO1xuICAgICAgICAgICAgdGhpcy5iYXIgPSB0aGlzLmVsLnF1ZXJ5U2VsZWN0b3IoJy5wcm9ncmVzcy1iYXInKTtcbiAgICAgICAgICAgIHRoaXMudGV4dCA9IHRoaXMuZWwucXVlcnlTZWxlY3RvcignLnByb2dyZXNzLXRleHQnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZWFkRmlsZTogZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IHRoaXMub25yZWFkLmJpbmQodGhpcyk7XG4gICAgICAgIHJlYWRlci5vbmVyciA9IHRoaXMub25lcnIuYmluZCh0aGlzKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgfSxcblxuICAgIG9ucmVhZDogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB2YXIgc3JjID0gcmVzaXplKGV2dC50YXJnZXQucmVzdWx0LCA1MDAsIDUwMCk7XG5cbiAgICAgICAgdGhpcy5zZXRCZyhzcmMpO1xuICAgIH0sXG5cbiAgICBvbmVycjogZnVuY3Rpb24gKCkge1xuXG4gICAgfSxcblxuICAgIHNldEJnOiBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIHRoaXMuZWwuc3R5bGUgPSAnYmFja2dyb3VuZC1pbWFnZTogdXJsKCcgKyB1cmwgKyAnKSc7XG4gICAgfSxcblxuICAgIHNldFByb2dyZXNzOiBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgcHJvZ3Jlc3MgPSBNYXRoLnJvdW5kKHByb2dyZXNzICogMTAwKTtcbiAgICAgICAgdGhpcy5iYXIuc3R5bGUgPSAnd2lkdGg6ICcgKyBwcm9ncmVzcyArICclJztcbiAgICAgICAgdGhpcy50ZXh0LmlubmVySFRNTCA9IHByb2dyZXNzICsgJyUnO1xuICAgIH0sXG5cbiAgICB1cGxvYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRhc2sgPSB0aGlzLm9wdHMudXBsb2FkZXIudXBsb2FkKHRoaXMuZmlsZSwgdGhpcy5vcHRzLnVybCwgdGhpcy5vcHRzLnBhcmFtcyk7XG5cbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3N1Y2Nlc3MnLCB0aGlzLm9uc3VjY2Vzcy5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGFzay5zdWJzY3JpYmUoJ3Byb2dyZXNzJywgdGhpcy5vbnByb2dyZXNzLmJpbmQodGhpcykpO1xuICAgICAgICB0YXNrLnN1YnNjcmliZSgnZmFpbCcsIHRoaXMub25mYWlsLmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh0YXNrLCByZXMpIHtcbiAgICAgICAgdGhpcy5zZXRCZyhyZXMpO1xuICAgICAgICB0aGlzLnByb2dyZXNzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5wcm9ncmVzcyk7XG4gICAgfSxcblxuICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uICh0YXNrLCBwcm9ncmVzcykge1xuICAgICAgICB0aGlzLnNldFByb2dyZXNzKHByb2dyZXNzKTtcbiAgICB9LFxuXG4gICAgb25mYWlsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGV4dC5pbm5lckhUTUwgPSAnVXBsb2FkIEZhaWxlZCc7XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vLi4vbGliL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTb3J0YWJsZTtcblxuZnVuY3Rpb24gc3dhcCAoZWwwLCBlbDEpIHtcbiAgICB2YXIgZWwwTmV4dCA9IGVsMC5uZXh0U2libGluZyxcbiAgICAgICAgZWwxTmV4dCA9IGVsMS5uZXh0U2libGluZztcblxuICAgIGVsMC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbDAsIGVsMU5leHQpO1xuICAgIGVsMS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbDEsIGVsME5leHQpO1xufVxuXG5mdW5jdGlvbiBTb3J0YWJsZSAoZWwsIHNlbGVjdG9yKSB7XG4gICAgdGhpcy5zZWxlY3RvciA9IHNlbGVjdG9yID8gc2VsZWN0b3IgOiAnLmNvbGxhZ2UtaW1nJztcblxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25tb3VzZWRvd24uYmluZCh0aGlzKSk7XG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbm1vdXNlbW92ZS5iaW5kKHRoaXMpKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbm1vdXNldXAuYmluZCh0aGlzKSk7XG5cbiAgICBlbC5jbGFzc05hbWUgKz0gJ2NvbGxhZ2Utc29ydGFibGUnO1xufVxuXG5Tb3J0YWJsZS5wcm90b3R5cGUgPSB1dGlsLmV4dGVuZCh7XG5cbiAgICB0YXJnZXQ6IG51bGwsXG5cbiAgICBvbm1vdXNlZG93bjogZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICBpZiAodXRpbC5tYXRjaGVzKGV2dC50YXJnZXQsIHRoaXMuc2VsZWN0b3IpKSB7XG4gICAgICAgICAgICB0aGlzLnRhcmdldCA9IGV2dC50YXJnZXQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25tb3VzZW1vdmU6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHV0aWwubWF0Y2hlcyhldnQudGFyZ2V0LCB0aGlzLnNlbGVjdG9yKSAmJiBldnQudGFyZ2V0ICE9PSB0aGlzLnRhcmdldCkge1xuICAgICAgICAgICAgc3dhcChldnQudGFyZ2V0LCB0aGlzLnRhcmdldCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25tb3VzZXVwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gbnVsbDtcbiAgICB9LFxuXG4gICAgc3dhcDogZnVuY3Rpb24gKGVsMCwgZWwxKSB7XG4gICAgICAgIFxuICAgIH0sXG5cbiAgICBvbjogZnVuY3Rpb24gKCkge31cblxufSwgdXRpbC5wdWJzdWIpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVXBsb2FkVGFzayA9IHJlcXVpcmUoJy4vVXBsb2FkVGFzaycpLFxuICAgIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlVXBsb2FkZXI7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICB1cmw6IG51bGwsXG4gICAgcGFyYW1zOiBudWxsXG59O1xuXG5mdW5jdGlvbiBGaWxlVXBsb2FkZXIgKG9wdHMpIHtcbiAgICB0aGlzLm9wdHMgPSB1dGlsLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdHMpO1xufVxuXG5GaWxlVXBsb2FkZXIucHJvdG90eXBlID0ge1xuXG4gICAgcGFyYWxsZWw6IDMsXG5cbiAgICB0aW1lb3V0UmV0cnk6IDIsXG5cbiAgICBxdWV1ZTogW10sXG5cbiAgICBwcm9jZXNzaW5nOiBbXSxcblxuICAgIHVwbG9hZDogZnVuY3Rpb24gKGZpbGUsIHVybCwgcGFyYW1zKSB7XG4gICAgICAgIHVybCA9IHVybCA/IHVybCA6IHRoaXMub3B0cy51cmw7XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcyA/IHBhcmFtcyA6IHRoaXMub3B0cy5wYXJhbXM7XG5cbiAgICAgICAgdmFyIHRhc2sgPSBuZXcgVXBsb2FkVGFzayh1cmwsIHRoaXMuZ2V0Rm9ybURhdGEoZmlsZSwgcGFyYW1zKSk7XG5cbiAgICAgICAgLy8gY2FsbGJhY2tzXG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdzdWNjZXNzJywgdGhpcy5vbnN1Y2Nlc3MuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCdmYWlsJywgdGhpcy5vbmZhaWwuYmluZCh0aGlzKSk7XG4gICAgICAgIHRhc2suc3Vic2NyaWJlKCd0aW1lb3V0JywgdGhpcy5vbnRpbWVvdXQuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvY2Vzc2luZy5sZW5ndGggPj0gdGhpcy5wYXJhbGxlbCkge1xuICAgICAgICAgICAgdGhpcy5xdWV1ZS5wdXNoKHRhc2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ydW4odGFzayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFzaztcbiAgICB9LFxuXG4gICAgZ2V0Rm9ybURhdGE6IGZ1bmN0aW9uIChmaWxlLCBwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBuZXcgRm9ybURhdGEoKTtcblxuICAgICAgICBkYXRhLmFwcGVuZCgnZmlsZScsIGZpbGUpO1xuICAgICAgICBpZiAocGFyYW1zIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgICAgIGRhdGEuYXBwZW5kKGlucHV0Lm5hbWUsIGlucHV0LnZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcblxuICAgIHJ1bjogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5wcm9jZXNzaW5nLnB1c2godGFzayk7XG4gICAgICAgIHRhc2suc3VibWl0KCk7XG4gICAgfSxcblxuICAgIGRvbmU6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHV0aWwucmVtb3ZlKHRoaXMucHJvY2Vzc2luZywgdGFzayk7XG5cbiAgICAgICAgLy8gcnVuIG5leHQgdGFza1xuICAgICAgICBpZiAodGhpcy5xdWV1ZS5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgdmFyIG5leHQgPSB0aGlzLnF1ZXVlWzBdO1xuXG4gICAgICAgICAgICB0aGlzLnJ1bihuZXh0KTtcbiAgICAgICAgICAgIHV0aWwucmVtb3ZlKHRoaXMucXVldWUsIG5leHQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIG9uc3VjY2VzczogZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGhpcy5kb25lKHRhc2spO1xuICAgIH0sXG5cbiAgICBvbmZhaWw6IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRoaXMuZG9uZSh0YXNrKTtcbiAgICB9LFxuXG4gICAgb250aW1lb3V0OiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBpZiAodGFzay50aW1lb3V0cyA+IHRoaXMudGltZW91dFJldHJ5KSB7XG4gICAgICAgICAgICB0YXNrLm9uZmFpbCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc3VibWl0IGFnYWluXG4gICAgICAgICAgICB0YXNrLnN1Ym1pdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVwbG9hZFRhc2s7XG5cbmZ1bmN0aW9uIFVwbG9hZFRhc2sgKHVybCwgZm9ybURhdGEpIHtcbiAgICB0aGlzLnVybCA9IHVybDtcbiAgICB0aGlzLmZvcm1EYXRhID0gZm9ybURhdGE7XG59XG5cblVwbG9hZFRhc2sucHJvdG90eXBlID0gdXRpbC5leHRlbmQoe1xuXG4gICAgdGltZW91dHM6IDAsXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHhociA9IHRoaXMueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgLy8gZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gdGhpcy5vbnByb2dyZXNzLmJpbmQodGhpcyk7XG4gICAgICAgIHhoci5vbnRpbWVvdXQgPSB0aGlzLm9udGltZW91dC5iaW5kKHRoaXMpO1xuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uc3VjY2Vzcyh4aHIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeGhyLnN0YXR1cyAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uZmFpbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIC8vIHNlbmQgdGhlIHJlcXVlc3RcbiAgICAgICAgeGhyLnRpbWVvdXQgPSAoMTAwMCAqIDYwKTtcbiAgICAgICAgeGhyLm9wZW4oJ3Bvc3QnLCB0aGlzLnVybCk7XG4gICAgICAgIHhoci5zZW5kKHRoaXMuZm9ybURhdGEpO1xuICAgIH0sXG5cbiAgICBvbnN1Y2Nlc3M6IGZ1bmN0aW9uICh4aHIpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdzdWNjZXNzJywgdGhpcywgeGhyLnJlc3BvbnNlVGV4dCwgeGhyLnN0YXR1cyk7XG4gICAgfSxcblxuICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdGhpcy5wdWJsaXNoKCdwcm9ncmVzcycsIHRoaXMsIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgIH0sXG5cbiAgICBvbnRpbWVvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy50aW1lb3V0cyArKztcbiAgICAgICAgdGhpcy5wdWJsaXNoKCd0aW1lb3V0JywgdGhpcyk7XG4gICAgfSxcblxuICAgIG9uZmFpbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnB1Ymxpc2goJ2ZhaWwnLCB0aGlzKTtcbiAgICB9XG5cbn0sIHV0aWwucHVic3ViKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gcmVzaXplIChzcmMsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyksXG4gICAgICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLFxuICAgICAgICBpbWcgPSBuZXcgSW1hZ2UoKTtcblxuICAgIGltZy5zcmMgPSBzcmM7XG4gICAgdmFyIGRpbWVuc2lvbiA9IHNjYWxlKGltZywge3dpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBjYW52YXMud2lkdGggPSBkaW1lbnNpb24ud2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGRpbWVuc2lvbi5oZWlnaHQ7XG4gICAgY3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIGRpbWVuc2lvbi53aWR0aCwgZGltZW5zaW9uLmhlaWdodCk7XG5cbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvanBlZycpO1xufVxuXG5mdW5jdGlvbiBzY2FsZSAoaW1nLCBtYXgpIHtcbiAgICB2YXIgaW1nQVIgPSBpbWcuaGVpZ2h0IC8gaW1nLndpZHRoLFxuICAgICAgICBtYXhBUixcbiAgICAgICAgc2NhbGVXaXRoV2lkdGggPSBmYWxzZTtcblxuICAgIGlmICghbWF4LmhlaWdodCkge1xuICAgICAgICBzY2FsZVdpdGhXaWR0aCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChtYXgud2lkdGggJiYgbWF4LmhlaWdodCkge1xuICAgICAgICBtYXhBUiA9IG1heC5oZWlnaHQgLyBtYXgud2lkdGg7XG4gICAgICAgIGlmIChtYXhBUiA+IGltZ0FSKSB7XG4gICAgICAgICAgICBzY2FsZVdpdGhXaWR0aCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc2NhbGVXaXRoV2lkdGgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBtYXgud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IG1heC53aWR0aCAqIGltZ0FSXG4gICAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiBtYXguaGVpZ2h0IC8gaW1nQVIsXG4gICAgICAgICAgICBoZWlnaHQ6IG1heC5oZWlnaHRcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzaXplO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGVsZW1lbnQgd291bGQgYmUgc2VsZWN0ZWQgYnkgdGhlIHNwZWNpZmllZCBzZWxlY3RvciBzdHJpbmdcbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IGVsICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IHNlbGVjdG9yIFtkZXNjcmlwdGlvbl1cbiAgICAgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICAgKi9cbiAgICBtYXRjaGVzOiBmdW5jdGlvbiAoZWwsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBwID0gRWxlbWVudC5wcm90b3R5cGU7XG4gICAgXHR2YXIgZiA9IHAubWF0Y2hlcyB8fCBwLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBwLm1vek1hdGNoZXNTZWxlY3RvciB8fCBwLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IGZ1bmN0aW9uKHMpIHtcbiAgICBcdFx0cmV0dXJuIFtdLmluZGV4T2YuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHMpLCB0aGlzKSAhPT0gLTE7XG4gICAgXHR9O1xuICAgIFx0cmV0dXJuIGYuY2FsbChlbCwgc2VsZWN0b3IpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdmFsdWUgZnJvbSBhcnJheVxuICAgICAqL1xuICAgIHJlbW92ZTogZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICAgICAgICBhcnJheS5zcGxpY2UoYXJyYXkuaW5kZXhPZihlbCksIDEpO1xuICAgIH0sXG5cbiAgICBleHRlbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG9iaiA9IGFyZ3VtZW50c1swXSxcbiAgICAgICAgICAgIHNyYztcblxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc3JjID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHNyYykge1xuICAgICAgICAgICAgICAgIGlmIChzcmMuaGFzT3duUHJvcGVydHkoa2V5KSkgb2JqW2tleV0gPSBzcmNba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFB1Ymxpc2ggLyBTdWJzY3JpYmUgUGF0dGVyblxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgcHVic3ViOiB7XG4gICAgICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX29ic2VydmVycykge1xuICAgICAgICAgICAgICAgIHRoaXMuX29ic2VydmVycyA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYSA9IHRoaXMuX29ic2VydmVyc1t0b3BpY107XG5cbiAgICAgICAgICAgIGlmICghKGEgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVuc3Vic2NyaWJlOiBmdW5jdGlvbiAodG9waWMsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXTtcblxuICAgICAgICAgICAgYS5zcGxpY2UoYS5pbmRleE9mKGhhbmRsZXIpLCAxKTtcbiAgICAgICAgfSxcblxuICAgICAgICBwdWJsaXNoOiBmdW5jdGlvbiAodG9waWMpIHtcbiAgICAgICAgICAgIHZhciBhID0gdGhpcy5fb2JzZXJ2ZXJzW3RvcGljXSxcbiAgICAgICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgICAgICAgICAgaWYgKGEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYVtpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn07XG4iXX0=
