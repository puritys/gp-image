#!/usr/bin/env node
var fs = require('fs');
var isDir = require('is-dir');


function main (path) {
    var fileList = [], dirList = [], nextDir = [], ret, filelistPath;
    fs.readdir(path, function (err , files) {
        var filePath;
        if (err) {
            console.log("Got a error: ",path, " ", err);
            return ;
        }
        files.forEach(function (file) {
            if (file === "filelist.json") return ;
            filePath = path + "/" + file;
            if (isDir.sync(filePath)) {
                console.log(filePath, " is a directory.")
                nextDir.push(filePath);
                dirList.push(file);
            } else {
                fileList.push(file);            
            }
        });
        if (nextDir) nextDir.forEach(main);
        ret = {
            dirs: dirList,
            files: fileList,
        };
        filelistPath = path + "/filelist.json";
        console.log(JSON.stringify(ret));
        fs.writeFileSync(filelistPath, JSON.stringify(ret));
    });
}

module.exports = main;
