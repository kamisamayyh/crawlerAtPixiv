/**
 * Created by SoRa on 2016/9/23 0023.
 */
var dataFileLists = require("./dataFileLists");
var c = require('./choice');
var http = require('http');
var https = require("https");
var fs = require('fs');
var cheerio = require('cheerio');
//var request = require('request');
//var request = require('superagent');
var querystring = require('querystring');
var fs = require('fs');
var url = "https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index";
//c.choice.choice_crawler();
//var data=new dataFileLists.dataFileLists('./config/DataFileLists.json');
//console.log(data.getDataFileLists());
//createF("/daa");
//getHtmlByHttps('https://source.pixiv.net/accounts/assets/pixiv.config.entry.chunk.js?3e66f8139bae0abd0e3f',function(html){
//   console.log(html)
//});
//console.log("是否只添加没有下载过的数据(yes/no)");
//readYesRoNo(function(){
//    console.log("yesFunc");
//    //setDataFileLists(successes);
//},function(){
//    console.log("NoFunc")
//    //setDataFileLists(successes);
//})
//console.log("asdgasdgasdg");
//getConsole(function(reuslt){
//    console.log(reuslt);
//    //process.stdin.emit('end'); //触发end事件
//});

function readYesRoNo(YesFunc,NoFunc){
    switch (readSyn()){
        case 'yes':
            YesFunc();
            break;
        case 'no':
            NoFunc();
            break;
        default :
            console.log("请重新输入！");
            readYesRoNo(YesFunc,NoFunc);
            break;
    }
}
function getConsole(cb){
    process.stdin.setEncoding('utf8');
    //输入进入流模式（flowing-mode，默认关闭，需用resume开启），注意开启后将无法read到数据
    //见 https://github.com/nodejs/node-v0.x-archive/issues/5813
    process.stdin.resume();
    process.stdin.on('data', function(chunk) {
        console.log('start!');
        //去掉下一行可一直监听输入，即保持标准输入流为开启模式
        process.stdin.pause();
        cb(chunk);
    });
    console.log('试着在键盘敲几个字然后按回车吧');
}

console.log(readSyn());;
function readSyn() {
    process.stdin.pause();

    var response = fs.readSync(process.stdin.fd, 1000, 0, "utf8");
    //process.stdin.resume();//监听继续
    return response[0].trim();
}
function createF(dir){
    if (fs.existsSync(dir)) {
        console.log('已经创建过此更新目录了');
    } else {
        fs.mkdirSync(dir);
        console.log('更新目录已创建成功\n');
    }
}
function getHtmlByHttps(url,successFunc){
    var req = https.get(url,function(res){
        var html = "";
        res.on('data',function(data){
            html += data;

        });
        res.on('end',function(){
            successFunc(html);

        });
    }).on('error',function(e){
        console.log('获取出错！\n'+"原因："+e);
    });
    req.on('socket',function(sock){
        sock.setTimeout(9999999999);
        sock.on('timeout',function(){
            console.log("请求超时");
        });
    });
}