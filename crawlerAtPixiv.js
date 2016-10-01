var http = require('http');
var https = require("https");
var fs = require('fs');
var cheerio = require('cheerio');
//var request = require('request');
var querystring = require('querystring');
var fs = require('fs');
var zlib = require('zlib');
var iconv = require('iconv-lite');
var request = require('superagent');
var pipe = require('pipe');
var async = require('async');

console.log("nodejs modules ok");
var url = "https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index";
var dir = './data';
var cookie=new Array();


var fails = new Array();

function saveImg(url,dir,name,referer){
    request
        .get(url)
        .set({ 'Referer': referer})
        .end(function(err,res){
            fs.writeFile(dir + "/"+name, res.body, 'binary', function (err) {
                if (err) throw err;
                console.log('file saved '+name);
            });
        });
}
function crawlerPicture(url,callback){
    getHtmlByRequest(url,function(res){
        var $ = cheerio.load(res.text);
        var src = $('.wrapper .original-image').attr('data-src');
        if(src)
            saveImg(src,dir, Math.floor(Math.random() * 100000)+"-"+getFileName(src),url);//并发
        else{
            fails.push({url:url,src:src});
        }
    });
    callback(null,'success'+url);
}
function crawlerNext($){
    var nextUrl = $('.next ._button').eq(0).attr('href');
    console.log(nextUrl);
    if(nextUrl!=undefined){
        getHtmlByRequest('http://www.pixiv.net/bookmark.php'+nextUrl,function(res){
            var $ = cheerio.load(res.text);
            var imgs = $('._image-items .image-item a._work ');
            var urls = [];
            for(var i=0;i< imgs.length;i++){
                var url = "http://www.pixiv.net/"+imgs.eq(i).attr('href');
                console.log(url);
                urls.push(url);
            }
            console.log(urls.length);
            async.mapLimit(urls,urls.length,function(url,callback){
                crawlerPicture(url,callback);
            },function(err,result){
                console.log(result);
            });
            crawlerNext($);
        });
    }


}
getHtmlByHttps(url,function(html){
    var $ = cheerio.load(html);
    var post_key = $('#old-login').find("input[name='post_key']").val();
    console.log("post_key"+post_key);
    var postData = querystring.stringify({
        'pixiv_id':'871147642@qq.com',
        'password':'yyh000000',
        'captcha':null,
        'g_recaptcha_response':null,
        'post_key':post_key,
        'source':'pc'
    });
    login(postData,function(){
        getHtmlByRequest('http://www.pixiv.net/',function(res){
            var $ = cheerio.load(res.text);
            getHtmlByRequest("http://www.pixiv.net/bookmark.php/",function(res){
                var $ = cheerio.load(res.text);
                var imgs = $('._image-items .image-item a._work');
                var urls = [];
                for(var i=0;i< imgs.length;i++){
                    var url = "http://www.pixiv.net/"+imgs.eq(i).attr('href');
                    console.log(url);
                    urls.push(url);
                }
                console.log(urls.length);
                async.mapLimit(urls,urls.length,function(url,callback){
                    crawlerPicture(url,callback);
                },function(err,result){
                    console.log(fails);
                });
                crawlerNext($);
            });

            console.log($('.bookmarks a').attr('href'));
        })
    });
});

function getFileName(url){
    var strs = url.split('/');
    return strs[strs.length-1];
}


function login(postData,func){
    var options ={
        hostname:'accounts.pixiv.net',
        port:443,
        path:'/api/login?lang=zh',
        method:'post',
        headers:{
            'Accept':'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding':'gzip, deflate, br',
            'Accept-Language':'zh-CN,zh;q=0.8',
            'Connection':'keep-alive',
            'Content-Length':postData.length,
            'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie':cookie,
            'Host':'accounts.pixiv.net',
            'Origin':'https://accounts.pixiv.net',
            'Referer':'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index',
            'User-Agent':'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.18 Safari/537.36',
            'X-Requested-With':'XMLHttpRequest'
        }
    }
    var data="";
    var req = https.request(options,function(res){

    });
    req.write(postData);
    req.on('response', function (response) {
        switch (response.headers['content-encoding']) {
            case 'gzip':
                var body = '';
                var gunzip = zlib.createGunzip();
                response.pipe(gunzip);
                gunzip.on('data', function (data) {
                    body += data;
                });
                gunzip.on('end', function () {
                    var returndatatojson= JSON.parse(body);
                    if(returndatatojson['error']){
                        console.log(returndatatojson['message']);
                        return;
                    }
                    console.log('登陆成功！跳转到：'+returndatatojson['body']['successed']['return_to']);
                    set_cookie(response.headers['set-cookie']);
                    func(response);
                    req.end();
                });
                gunzip.on('error', function (e) {
                    console.log('error' + e.toString());
                    req.end();
                });
                break;
            case 'deflate':
                var output = fs.createWriteStream("f:temp.txt");
                response.pipe(zlib.createInflate()).pipe(output);
                req.end();
                break;
            default:req.end();
                break;
        }
    });
    req.on("error",function(e){
        console.log("error:"+ e);
    });
}


function getHtmlByRequest(url,func){
    var headers={
        'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding':'gzip, deflate, sdch',
        'Accept-Language':'zh-CN,zh;q=0.8',
        'Connection':'keep-alive',
        'Cookie':cookie,
        'Upgrade-Insecure-Requests':1,
        'Host':'www.pixiv.net',
        'Referer':'http://www.pixiv.net/',
        'User-Agent':'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.18 Safari/537.36'
    };
    request
        .get(url)
        .set(headers)
        .end(function(err,res){
            set_cookie(res.headers['set-cookie']);
            func(res);
        });
}

function getHtmlByHttps(url,successFunc){
    var req = https.get(url,function(res){
        var html = "";
        res.on('data',function(data){
            html += data;
        });
        res.on('end',function(){
            set_cookie(res.headers['set-cookie']);
            successFunc(html);
        });
    }).on('error',function(e){
        console.log('获取出错！\n'+"原因："+e);
    });
    req.on('socket',function(sock){
        sock.setTimeout(9999999999);
        sock.on('error', function (exc) {
            console.log("socket错误： " + exc);
        });
        sock.on('timeout',function(){
            console.log("请求超时");
        });
    });
    req.end();
}

function set_cookie(Cookie){
    var cookie_keys = [];
    var vl_cookie=[];
    for(var i in cookie){
        var keys='';
        var cookies = cookie[i].split(";");
        for(var j in cookies){
            var C = cookies[j].split("=");
            keys+=C[0];
        }
        cookie_keys.push(keys);
    }
    for(var i in Cookie){
        var keys = '';
        var Cookies = Cookie[i].split(";");
        for(var j in Cookies){
            var c = Cookies[j].split("=");
            keys+=c[0];
        }
        if(cookie.length==0){
            vl_cookie.push(Cookie[i]);
        }
        else{
            var flag = true;
            for(var j in cookie_keys){
                if(keys==cookie_keys[j]){
                    cookie[j] = Cookie[i];
                    flag = false;
                    break;
                }
            }
            if(flag)
            vl_cookie.push(Cookie[i]);
        }
    }

    if(cookie.length==0){
        cookie = vl_cookie;
    }
    else
    cookie = cookie.concat(vl_cookie);
}


function writeFile(url,text){
    fs.writeFile(url, text, function(err){
        if(err)
            console.log("fail " + err);
        else
            console.log("写入文件ok");
    });
}