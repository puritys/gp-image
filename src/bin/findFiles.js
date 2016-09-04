#!/usr/bin/env node
var fs = require('fs');
var isDir = require('is-dir');
var param = require('commander');

param.version('0.0.1')
    .option('-p, --path [type]', 'enable debug or not', '')
    .parse(process.argv);

if (!param.path) {
    console.log('Missing parameter --path xx');
    process.exit(1);
}

main(param['path']);

function main (path) {
    var fileList = [], dirList = [], nextDir = [], ret, filelistPath;
    fs.readdir(path, function (err , files) {
        var filePath;
        if (err) {
            console.log("Got a error: ",path, " ", err);
            return ;
        }
        files.forEach(function (file) {
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

