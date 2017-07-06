#! /usr/bin/env node
var image = require('lwip')
//var Queue = require('better-queue');
var fs = require('fs');
var args = require('minimist')(process.argv.slice(2));

// obtain an image object:
var allowed_ext = [".jpg", ".jpeg", ".gif", ".png"]
var stream

var processImage = function(dir, imgfilename) {
    var fn = imgfilename.substring(0, imgfilename.lastIndexOf('.'));
    var ext = imgfilename.substring(imgfilename.lastIndexOf('.'), imgfilename.length).toLowerCase();
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
        newfilename = newfilename + ext;
    }

    if (args.d || args.dir) {
        var newdir = newfilenamePath + ( args.d ? args.d : args.dir )
        if (!fs.existsSync(newdir))
            fs.mkdirSync(newdir);
        newfilename = newdir + '/' + newfilename
    }

    image.open(newfilenamePath + imgfilename, function (err, img) {
        if (err) {
            console.error("Woops: %s", err.message)
            return;
        }

        var currWidth = img.width()
        var currHeight = img.height()
        var newHeight = currHeight
        var newWidth = currWidth
        var resize = false;
        var cropWidth = false;
        var cropHeight = false;
        if(args.width && !(args.height)) {
            newWidth = args.width
            newHeight = (newWidth / currWidth) * currHeight
            resize = true
            if (args.maxheight && (newHeight > args.maxheight))
                cropHeight = true
        } else if(args.height && !(args.width)) {
            newHeight = args.height
            newWidth = (newHeight / currHeight) * currWidth
            resize = true;
            if (args.maxwidth && (newWidth > args.maxwidth))
                cropWidth = true
        } else if (args.height && args.width) {
            newWidth = args.width
            newHeight = args.height
            resize = true;
        }

        if (resize) {
            console.log("Resizing %s (w:%s,h%s) to %s (w:%s,h:%s)",  newfilenamePath + imgfilename, currWidth, currHeight, newfilename, newWidth, newHeight)
            img.resize(newWidth, newHeight, "lanczos", function (err, imgResized) {
                if (err) {
                    console.error('Error resizing %s. %s', imgResized, err.message)
                    return;
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
                        left =  (a * perc) + 1
                        right = newWidth - (a * _perc)
                    }
                    if (cropHeight) {
                        var a = (newHeight - args.maxheight)
                        var perc = (align / 100)
                        var _perc = (1 - perc)
                        top = (a * perc) + 1
                        bottom = newHeight - (a * _perc)
                    }

                    console.log("Cropping %s (w:%s,h%s) to %s (w:%s,h:%s)",  newfilenamePath + imgfilename, currWidth, currHeight, newfilename, (right - left) + 1, (bottom - top) + 1)

                    imgResized.crop(left, top, right, bottom, function (err, imgCropped) {
                        if(err) {
                            console.error('Error cropping %s. %s', imgCropped, err.message)
                            return;
                        }
                        imgCropped.writeFile(newfilename, function(err){
                            if (err) {
                                console.error('Write error: %s', err.message)
                            } else if (dir && dir != '') {
                                stream.write('   - url: ' + imgfilename + '\n')
                            }
                        });
                    })

                } else {
                    imgResized.writeFile(newfilename, function(err){
                        if (err) {
                            console.log('Write error: %s', err.message)
                        } else if (dir && dir != '' && args.jekyll) {
                            stream.write('   - url: ' + imgfilename + '\n')
                        }
                    });
                }
            })

        }
    })
}


//console.log('./image-cutter tool.');

if (!args._ || args._.length == 0) {
    console.log('Unknown usage.')
    console.log('./image-cutter <image-file || directory> {image-file1}.... [OPTIONS]')
    console.log('         OPTIONS:')
    console.log('         --width <value> (Optional: If OMITTED will resize to respect width/heigh ratio)')
    console.log('         --height <value> (Optional: If OMITTED will resize to respect width/heigh ratio)')
    console.log('         --maxwidth (Optional: crop, if --width is omitted)')
    console.log('         --maxheight (Optional: crop, if --height is omitted)')
    console.log('         --crop (Optional 0-100: 0 = top,left, 100% = bottom,right. Default is 50.)')
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
        files.forEach((function(file) {
            //console.log('Processing %s', imgfilename + '/' + file)
            processImage(imgfilename, file)
        }))

    } else {
        processImage('', imgfilename)
    }
})

//process.exit(0);








