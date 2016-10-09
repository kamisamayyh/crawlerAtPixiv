/**
 * Created by SoRa on 2016/10/8 0008.
 */
var fs = require('fs');
function dataFileLists(url){
    this.url = url;
}
dataFileLists.prototype.setUrl=function(url){
    this.url = url;
}
dataFileLists.prototype.getUrl=function(){
    return this.url;
}
dataFileLists.prototype.getDataFileLists=function(){
    var data = fs.readFileSync(this.url,'utf-8');
    return JSON.parse(data);
}
dataFileLists.prototype.setDataFileLists=function(lists){
    fs.writeFile(this.url, JSON.stringify(lists), function(err){
        if(err)
            console.log("fail " + err);
    });
}
exports.dataFileLists = dataFileLists;
