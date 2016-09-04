/*
 * Install  dest/css dest/js dest/html/index.html  
 *
 */
var mkdirp = require('mkdirp');
var walk   = require('walk');
var fs     = require('fs');
var cp     = require('cp');

var files  = ["dest/css", "dest/js", "dest/image"];
files.forEach(function (d) {
    mkdirp(d);
});

var copy = {};
copy[__dirname+"/../../dest/css"] = "dest/css";
copy[__dirname+"/../../dest/js"] = "dest/js";


Object.keys(copy).forEach(function (from) {
    var w = walk.walk(from);
    var dest;
    dest = copy[from];

    w.on('file', function (root, fileStates) {
        var name, srcFile, destFile;
        name = fileStates.name;
        if (name.match(/\.(css|js)$/)) {
            srcFile = from + "/" + name;
            destFile = dest + "/" + name;
            cp.sync(srcFile, destFile);
        }
    });
    w.on('error', function (root) {
        console.log("error ", root);
    });
    w.on('end', function () {console.log("copy source done");});
       
});

cp.sync(__dirname +"/../../src/html/index.html", "index.html");

var imagePath = __dirname +"/../../src/image";
var w = walk.walk(imagePath);
w.on('file', function (root, states) {
    var src, dest, file;
    file = states.name;
    src = imagePath +"/"+ file;
    dest = "dest/image/" + file;
    cp.sync(src, dest);
});

