/**
 * Created by SoRa on 2016/10/8 0008.
 */
var fs = require('fs');

function readSyn(callback) {
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.removeAllListeners();
    process.stdin.on('data', function(chunk){
        process.stdin.pause();
        callback(chunk.substr(0,chunk.length-2));
    });

}
function getFileName(url){
    var strs = url.split('/');
    return strs[strs.length-1];
}


exports.readSyn = readSyn;
exports.getFileName = getFileName;

