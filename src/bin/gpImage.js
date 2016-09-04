#!/usr/bin/env node
var param = require('commander')
    , run;

param.version('0.0.1')
    .option('-i, --init', 'initial', 'true')
    .option('-f, --find [type]', 'the image directory', '')
    .parse(process.argv);

if (param.init === true || param.init === "true") {
    console.log("initialize gpImage. ");
    run = require('./init.js');
} else if (param.find) {
    console.log("find all image files");
    run = require('./findFiles.js');
    run(param['find']);
}
