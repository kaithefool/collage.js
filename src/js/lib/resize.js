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
