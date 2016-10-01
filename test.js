/**
 * Created by SoRa on 2016/9/23 0023.
 */
var http = require('http');
var https = require("https");
var fs = require('fs');
var cheerio = require('cheerio');
//var request = require('request');
//var request = require('superagent');
var querystring = require('querystring');
var fs = require('fs');
var url = "https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index";

getHtmlByHttps('https://source.pixiv.net/accounts/assets/pixiv.config.entry.chunk.js?3e66f8139bae0abd0e3f',function(html){
   console.log(html)
});
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