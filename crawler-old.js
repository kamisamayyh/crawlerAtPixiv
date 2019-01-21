/**
 * Created by SoRa on 2016/9/26 0026.
 */
var path = require('path');
var http = require('http');
var https = require("https");
var cheerio = require('cheerio');
//var request = require('request');
var querystring = require('querystring');
var fs = require('fs');
var zlib = require('zlib');
var iconv = require('iconv-lite');
var request = require('superagent');
var pipe = require('pipe');
var async = require('async');

var cookie=new Array();
var urls = new Array();
var DataFileLists = "./config/DataFileLists.json";
var dir = path.resolve('./')+"/data/"+new Date().getFullYear()+new Date().getMonth()+new Date().getDay()+new Date().getHours()+new Date().getMinutes()+new Date().getSeconds() ;
//var dir =path.resolve('./')+"/data/"+new Date().toLocaleString();
async.waterfall([
    function(callback){//获取登陆页面
        var url = "https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index";
        var req = https.get(url,function(res){
            var html = "";
            res.on('data',function(data){
                html += data;
            });
            res.on('end',function(){
                set_cookie(res.headers['set-cookie']);
                callback(null, html);
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
    },
    function(html, callback){//login
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
                        callback(null);
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
    },function(callback){//获取到主页面，获得PHPSSID

        getHtmlByRequest('http://www.pixiv.net/',function(res){
            var $ = cheerio.load(res.text);
            callback(null);
            console.log($('.bookmarks a').attr('href'));
        })
    },function(callback){//到达收藏页面
        crawlerPicturePageAndNext("http://www.pixiv.net/bookmark.php/",callback);
    }
], function (err, result) {
    crawlerSrc(urls);//爬取图片页面
});
function crawlerSrc(urls){//爬取图片页面
    var length = 20;
    length>=urls.length?length=urls.length:length=length;
    async.mapLimit(urls,length,function(url,callback){
        crawlerPictureSrc(url,callback);
    },function(err,result){
        var failUrls = [];
        var successes = [];
        for(var i in result){
            if(!result[i].src){
                console.log(result[i].src);
                failUrls.push(result[i].url);
            }
            else if(result[i].arr){
                for(var j in result[i].src){
                    successes.push({src:result[i].src[j],url:result[i].url[j]});
                }
            }
            else{
                successes.push({src:result[i].src,url:result[i].url});
            }
        }
//        for(var i in failUrls){
//            writeFile("F:\\用户目录\\Documents\\Web\\crawlerAtPixiv\\text.txt",failUrls[i]+'\n');
//        }
        if(failUrls)
        console.log("失败："+failUrls);//控制台打印失败url
        var srcs=[];
        console.log("是否只添加没有下载过的数据(yes/no)");
        readYesRoNo(function(){
            var data = getDataFileLists();
            for(var i in successes){
                var flag = false;
                for(var j in data){
                    if(data[j].src==successes[i].src){
                        flag = true;
                    }
                }
                if(!flag){
                    srcs.push(successes[i]);
                }
            }
            console.log(data.length+":::"+successes.length);
            //console.log("data:"+getDataFileLists());
            setDataFileLists(successes);
        },function(){
            srcs=successes;
           setDataFileLists(successes);
        });

        console.log("read end");
        var l = 20;
        l>=srcs.length?l=srcs.length:l=l;
        async.mapLimit(srcs,l,function(src,callback){
            saveImg(src.src,dir,getFileName(src.src),src.url,callback);
        },function(err,result){

            //console.log("下载完成！"+result.length+"个");
        });
    });
}
function crawlerPictureSrc(url,callback){//获取图片地址
    async.waterfall([
            function(callback){//加载界面获取图片地址
                getHtmlByRequest(url,function(res){
                    var $ = cheerio.load(res.text);
                    var src = $('.wrapper .original-image').attr('data-src');//单数图片
                    var flag = false;
                    if(src){
                        callback(null,src,url,flag);
                    }
                    else{
                        flag = true;
                        src = $('.works_display  a._work').attr('href');//复数图片
                        if(src==undefined){//错误暂时保留，pixiv跨域设置
                           // writeFile("F:\\用户目录\\Documents\\Web\\crawlerAtPixiv\\text.html",url);
                            flag = false;
                        }
                        callback(null,src,url,flag);
                    }

                });
            },
            function(src,url,flag,callback){
                if(src==null){
                    callback(null,url,src,false);
                }
                else
                if(flag){
                    src = "http://www.pixiv.net/"+src;
                    getByRequestAndReferer(src,url,function(err,res){//复数图片并发获取
                        var $ = cheerio.load(res.text);
                        var srcs = $(".manga .item-container a.full-size-container");
                        var Srcs = [];
                        for(var i=0;i<srcs.length;i++){
                            Srcs.push("http://www.pixiv.net"+srcs.eq(i).attr("href"));
                        }
                        //console.log(Srcs);
                        callback(null,src,Srcs,flag);
                    });
                }
                else{
                    callback(null,url,src,flag);
                }
            },
            function(url,srcs,flag,callback){//进入图片显示页面，获取图片地址
                if(flag){
                    async.mapLimit(srcs,srcs.length,function(src,callback){
                        getByRequestAndReferer(src,url,function(err,res){
                            var $ = cheerio.load(res.text);
                            var Src = $("img").attr("src");

                            callback(null,{url:src,src:Src});
                        });
                    },function(err,result){
                        var Urls = [];
                        var Srcs = [];
                        for(var i in result){
                            Urls.push(result[i].url);
                            Srcs.push(result[i].src);
                        }
                        callback(null,Urls,Srcs,true);
                    });
                }

                else{
                    callback(null,url,srcs,flag);
                }
            }
        ],
        function(err,url,src,flag){//callback返回图片
            //console.log("src:"+src)
            callback(null,{url:url,src:src,arr:flag});
        });

}
function crawlerPictureSrcArr(url,referer,func){

}
function saveImg(url,dir,name,referer,callback){
    if (fs.existsSync(dir)) {
        //console.log('已经创建过此更新目录了');
    } else {
        fs.mkdirSync(dir);
        //console.log('更新目录已创建成功\n');
    }
    getByRequestAndReferer(url,referer,function(err,res){
        fs.writeFile(dir + "/"+name, res.body, 'binary', function (err) {
            if (err) throw err;
            console.log('file saved '+name);
            callback(null,name);
        });
    });
}
function crawlerPicturePageAndNext(url,callback){
    getHtmlByRequest(url,function(res){
        var $ = cheerio.load(res.text);
        var imgs = $('._image-items .image-item a._work');
        for(var i=0;i< imgs.length;i++){
            var url = "http://www.pixiv.net/"+imgs.eq(i).attr('href');
            urls.push(url);
        }
        console.log(urls.length);
        var nextUrl = $('.next ._button').eq(0).attr('href');
        if(nextUrl!=undefined)
        crawlerPicturePageAndNext("http://www.pixiv.net/bookmark.php"+nextUrl,callback);
        else{
            callback(null);
        }
    });
}
function getByRequestAndReferer(url,referer,func){
    request
        .get(url)
        .set({ 'Referer': referer,'Cookie':cookie})
        .end(function(err,res){
            if(err){
                console.log("错误："+err+"重试链接url"+url);
                getByRequestAndReferer(url,referer,func);
                return;
            }
            func(err,res);
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
            if(err){
                console.log("错误："+err+"重试链接url"+url);
                getHtmlByRequest(url,func);
                //throw err+"url:"+url;
                return;
            }
            //if(res.headers)
            if(res.statusCode!=200){
                console.log(url+"错误!");
                throw url+":"+res.statusCode;
            }

            set_cookie(res.headers['set-cookie']);
            //else
            //console.log("出错："+url);
            func(res);
        });
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
function getFileName(url){
    var strs = url.split('/');
    return strs[strs.length-1];
}

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
function getDataFileLists(){
    var data = fs.readFileSync(DataFileLists,'utf-8');
    return JSON.parse(data);
}
function setDataFileLists(lists){
    fs.writeFile(DataFileLists, JSON.stringify(lists), function(err){
        if(err)
            console.log("fail " + err);
        else
            console.log("ok");
    });
}
function readSyn() {
    process.stdin.pause();
    var response = fs.readSync(process.stdin.fd, 1000, 0, "utf8");
    //process.stdin.resume();
    return response[0].trim();
}