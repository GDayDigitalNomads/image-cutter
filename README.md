# Image Cutter

A simple image cutter tool for individual and bulk image cutting for better performance of websites.

#### Installation

    $ git clone git@github.com:GDayDigitalNomads/image-cutter.git
    $ npm install
    $ npm link
    
    
#### usage

    $ image-cutter <image-file || directory> [OPTIONS]
    
         OPTIONS:
             --width <value> (Optional: will respect width/heigh ratio)
             --height <value> (Optional: will respect width/heigh ratio)
             --maxwidth (Optional: Crop if --width is omitted, and final width is > maxwidth)
             --maxheight (Optional: Crop if --height is omitted, and final height is > maxheight)
             --crop (Optional 0-100: 0 = crop from top,left, 100% = crop from bottom,right. Default is 50.)
             --prefix <value> (Optional: add prefix to output file name)
             --suffix <value> (Optional: add suffix to output file name)             
             --name <value> (Optional: new image name - overrides --prefix and --suffix)
             --dir <value> (Optional: output file(s) to directory)
             --jekyll <value> (Optional: create a .yml of results)
                 
                 
##### Examples:

    
        $ ./image-cutter imagedirectory --width 200 --dir width200
        # Resizes all images in "imagedirectory"  to a width of 200px (height/width ratio kept) 
        # output results to "imagedirectory/width200"
    
        $ ./image-cutter imagedirectory --height 200 --maxwidth 200 --crop 100 --dir height200
        # Resizes all images in "imagedirectory" to a height of 200px (height/width ratio kept)
        # The crops all resulting images so they are no larger than 200px in height, removing the top of the image.
        # output results to "imagedirectory/height200"
            
        $ ./image-cutter image.jpg --height 200 --width 200 --name newimage.jpg
        # Resizes image.jpg to a width/height of 200px
        # outputs to newimage.jpg
           
##### Handy commands
        $ for f in `find`; do mv -v "$f" "`echo $f | tr '[A-Z]' '[a-z]'`"; done
        # converts all image files to lower case - handy when working across case insensitive AND case sensitive platforms
                
                
The MIT License (MIT)

>
>Copyright (c) Jordan Rancie
>
>Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:
>
>The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
>
>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.        