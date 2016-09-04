#!/usr/bin/env node
var param = require('commander');

param.version('0.0.1')
    .option('-i, --init', 'enable debug or not', 'true')
    .parse(process.argv);

if (param.init === true || param.init === "true") {
    console.log("initialize gpImage. ");
    var run = require('./init.js');
}
