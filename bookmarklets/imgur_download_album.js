// load jslib
var s = document.createElement('script');
document.body.appendChild(s)
s.onload = function(){
    console.log('loaded lib 1');
    // Load saveAs lib because i am lazy
    var s2 = document.createElement('script');
    document.body.appendChild(s2);
    s2.onload = function(){
        console.log('loaded lib 2');
        // Getting the current image (?) object in a ridicoulous way.
        var post = Imgur.InsideNav._instance._.image;
        var imgs = Imgur.InsideNav._instance._.albumImageStore._.posts[Imgur.InsideNav._instance._.hash];
        if(imgs == undefined){
            imgs = Imgur.InsideNav._instance._.image;
            if(imgs.is_album)
                imgs = imgs.album_images;
            else
                imgs = Object({'count':1, 'images':imgs});
        }

        var zip = new JSZip();
        var _counter = 0;

        function add_image(img){
            console.log(img);
            _counter++;
            var src = img.hash + img.ext;
            document.title = 'Files to download remaining: ' + _counter;
            console.log('Loading ', src);

            // We just assume newish browser here.
            // For fallback use: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Sending_and_Receiving_Binary_Data
            var oReq = new XMLHttpRequest();
            oReq.open("GET", 'https://i.imgur.com/' + src, true);
            oReq.responseType = "arraybuffer";
            oReq.onload = function(oEvent) {
                _counter--;
                document.title = 'Files to download remaining: ' + _counter;
                var arrayBuffer = oReq.response;
                zip.file(src, arrayBuffer);
                // If all files are downloaded and added create the zip
                if(_counter == 0){
                    document.title = 'Done dowloading. Creating zip';
                    zip.generateAsync({type:"blob"})
                    .then(function (blob) {
                        saveAs(blob, post.hash+".zip");
                        console.log("Succesfull created zip.");
                    }, function(){
                        document.title = "Error creating the zip";
                    });
                }
            };
            oReq.send();
        }

        if(imgs.count != imgs.images,length){
            console.log('WARNING: Not all images will be loaded. ('+imgs.images.length+' / '+imgs.count+')');
            imgs = imgs.images;
        }
        for(var i=0; i< imgs.length; ++i){
            add_image(imgs[i]);
        }
    };
    s2.src = 'https://cdn.rawgit.com/eligrey/FileSaver.js/4db4a78aad96b8e9d68316b568a76c5caf9c0225/FileSaver.min.js';
};
s.src = 'https://cdn.rawgit.com/Stuk/jszip/ab3829ab0c09bf62fadfcf3c61907f05ebcd7bc5/dist/jszip.min.js';
