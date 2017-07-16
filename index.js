#! /usr/bin/env node
var lwip = require('lwip')
var events = require('events');
var eventEmitter = new events.EventEmitter();
var fs = require('fs');
var args = require('minimist')(process.argv.slice(2));
var Queue = require('better-queue');

// obtain an image object:
var allowed_ext = ["jpg", "jpeg", ".gif", "png"]
var stream

var tasks = []


eventEmitter.on('success', function (e) {
    console.log('Success: ' + e)
    if (tasks.size > 0) {
        var f = tasks.pop()
        f()
    }
})

eventEmitter.on('fail', function (e) {
    console.log('Fail' + e)
});

var processImage = function (dir, imgfilename) {
    var fn = imgfilename.substring(0, imgfilename.lastIndexOf('.'));
    var ext = imgfilename.substring(imgfilename.lastIndexOf('.') + 1, imgfilename.length).toLowerCase();
    if (!allowed_ext.includes(ext)) {
        console.log('Skipping %s...unsupported image....', imgfilename)
        return;
    }
    var newfilename = ''
    var newfilenamePath = dir !== '' ? dir + '/' : ''
    if (args.name) {
        newfilename = args.name
    } else {
        if (args.prefix)
            newfilename = args.prefix + newfilename;
        newfilename = newfilename + fn;
        if (args.suffix)
            newfilename = newfilename + args.suffix;
        newfilename = newfilename + '.' + ext;
    }

    if (args.dir) {
        var newdir = newfilenamePath + ( args.d ? args.d : args.dir )
        if (!fs.existsSync(newdir))
            fs.mkdirSync(newdir);
        newfilename = newdir + '/' + newfilename
    }

    fs.readFile(newfilenamePath + imgfilename, function (err, buffer) {
        lwip.open(buffer, ext, function (err, image) {
            if (err) {
                console.error("Woops: %s", err.message)
                return;
            }

            var opts = {}
            if (args.quality) {
                if (ext === 'jpg' || ext === 'jpeg')
                    opts = {quality: args.quality}
                else if (ext === 'png') {
                    if (agrs.quality > 10 && agrs.quality <= 30)
                        opts = {comression: 'high'}
                    else if (agrs.quality > 30 && agrs.quality <= 70)
                        opts = {comression: 'fast'}
                    else if (agrs.quality > 70)
                        opts = {comression: 'none'}
                }
            }

            // First, lets work on a buffer only

            var currWidth = image.width()
            var currHeight = image.height()
            var newHeight = currHeight
            var newWidth = currWidth
            var rotate = (args.rotate ? args.rotate * 90 : false);
            var resize = false;
            var cropWidth = false;
            var cropHeight = false;

            if (args.width && !(args.height)) {
                newWidth = args.width
                newHeight = (newWidth / currWidth) * currHeight
                resize = true
                if (args.maxheight && (newHeight > args.maxheight))
                    cropHeight = true
            }
            else if (args.height && !(args.width)) {
                newHeight = args.height
                newWidth = (newHeight / currHeight) * currWidth
                resize = true;
                if (args.maxwidth && (newWidth > args.maxwidth))
                    cropWidth = true
            }
            else if (args.height && args.width) {
                newWidth = args.width
                newHeight = args.height
                resize = true;
            }

            if (cropWidth || cropHeight) {
                var top = 1
                var bottom = newHeight
                var left = 1
                var right = newWidth
                var align = args.crop || args.crop == 0 ? args.crop : 50

                if (cropWidth) {
                    var a = (newWidth - args.maxwidth)
                    var perc = (align / 100)
                    var _perc = (1 - perc)
                    left = (a * perc) + 1
                    right = newWidth - (a * _perc)
                }
                if (cropHeight) {
                    var a = (newHeight - args.maxheight)
                    var perc = (align / 100)
                    var _perc = (1 - perc)
                    top = (a * perc) + 1
                    bottom = newHeight - (a * _perc)
                }
            }

            // Image operations here

            var batch = image.batch();

            if (rotate) {
                console.log("Rotating %s by %s deg", newfilenamePath + imgfilename, rotate)
                batch = batch.rotate(rotate)
            }

            if (resize) {
                console.log("Resizing %s (w:%s,h%s) to %s (w:%s,h:%s)", newfilenamePath + imgfilename, currWidth, currHeight, newfilename, newWidth, newHeight)
                batch = batch.resize(newWidth, newHeight)
            }

            if (cropWidth || cropHeight) {
                console.log("Cropping %s (w:%s,h%s) to %s (w:%s,h:%s)", newfilenamePath + imgfilename, currWidth, currHeight, newfilename, (right - left) + 1, (bottom - top) + 1)
                batch = batch.crop(left, top, right, bottom)
            }

            batch.toBuffer(ext, opts, function (err, buffer) {
                fs.writeFile(newfilename, buffer, function(err) {
                    if (err) {
                        console.error('Write error: %s', err.message)
                    } else if (dir && dir != '' && args.jekyll) {
                        stream.write('   - url: ' + imgfilename + '\n')
                    }
                })
            })
        })
    })
}


if (!args._ || args._.length == 0) {
    console.log('Unknown usage.')
    console.log('./image-cutter <image-file || directory> {image-file1}.... [OPTIONS]')
    console.log('         OPTIONS:')
    console.log('         --width <value> (Optional: If OMITTED will resize to respect width/heigh ratio)')
    console.log('         --height <value> (Optional: If OMITTED will resize to respect width/heigh ratio)')
    console.log('         --maxwidth <value> (Optional: crop, if --width is omitted)')
    console.log('         --maxheight <value> (Optional: crop, if --height is omitted)')
    console.log('         --crop <value> (Optional 0-100: 0 = top,left, 100% = bottom,right. Default is 50.)')
    console.log('         --rotate <value> (Optional 1-3: 1=90deg, 3=270deg)')
    console.log('         --quality <value> (Optional 10-100)')
    console.log('         --name <value> (Optional: new image name - overrides --prefix and --suffix)')
    console.log('         --dir <value> (Optional: output to directory)')
    console.log('         --prefix <value> (Optional: add prefix to output file name)')
    console.log('         --suffix <value> (Optional: add suffix to output file name)')
    console.log('         --jekyll <value> (Optional: create a jekyll yml file for the conversion)')
    return;
}

args._.forEach(function (imgfilename) {

    if (fs.existsSync(imgfilename) && fs.statSync(imgfilename).isDirectory()) {
        console.log('%s is a directory...converting all images....', imgfilename)
        if (args.jekyll) {
            var outputFileName = (args.dir ? args.dir + '_' : '') + 'gallery_.yml'
            var out = ' - title: ' + imgfilename + '\n' +
                '   directory: ' + imgfilename + '\n' +
                '   thumb: ' + (args.dir ? args.dir : '') + '\n' +
                '   images: \n'
            stream = fs.createWriteStream(imgfilename + '/' + outputFileName, {flags: 'w'});
            stream.write(out);
        }
        var files = fs.readdirSync(imgfilename);
        files.forEach((function (file) {
            //console.log('Processing %s', imgfilename + '/' + file)
            processImage(imgfilename, file)
        }))

    } else {
        processImage('', imgfilename)
    }
})

//process.exit(0);








