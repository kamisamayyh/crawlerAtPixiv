/**
 * Created by SoRa on 2016/10/8 0008.
 */
var async = require('async');


var choice = require('./choice');
var crawler = require('./crawler');
var crawler_new = new crawler.crawler("871147642@qq.com",'yyh000000');
crawler_new.login(function(){
    choice.choice.choice_crawler(
        function(){
            crawler_new.condition = 'http://www.pixiv.net/bookmark.php';
            crawler_new.dataFileLists.setUrl("./config/dataFileListBookmark.json");
            crawler_new.dir = crawler_new.dir+"bookmark";
            async.waterfall([
                function(callback){//到达收藏页面
                    crawler_new.crawlerPicturePageAndNext(crawler_new.condition,callback);
                }
            ], function (err, result) {
                crawler_new.crawler_url(crawler_new.urls);
            });
        },function(){
            crawler_new.condition = 'http://www.pixiv.net/search.php';

            async.waterfall([
                function(callback){
                    choice.choice.choice_search(function(result,src){
                        crawler_new.dir = crawler_new.dir+src;
                        crawler_new.dataFileLists.setUrl("./config/dataSearchFileList"+src+'.json');
                        var url=encodeURI(result);

                        crawler_new.crawlerPicturePageAndNext(url,callback);
                    });
                }
            ], function (err, result) {
                crawler_new.crawler_url(crawler_new.urls);
            });
    });
});