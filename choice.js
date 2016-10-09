/**
 * Created by SoRa on 2016/10/8 0008.
 */
var fs = require('fs');
var async = require('async');
var util = require('./util.js');
function choice(){

}
choice.prototype.choice_all = function(YesFunc,NoFunc){
    console.log("是否只添加没有下载过的数据(yes/no)");
    var $this =this;
    util.readSyn(function(syn){
        switch (syn){
            case 'yes':
                YesFunc();
                break;
            case 'no':
                NoFunc();
                break;
            default :
                //console.log("请重新输入！");
                //$this.choice_all(YesFunc,NoFunc);
                break;
        }
    })

}
choice.prototype.choice_crawler = function(func1,func2){
    console.log("请选择爬取方式：\n 1:爬取收藏pixiv\n 2:通过搜索爬取");
    var $this =this;
    util.readSyn(function(syn){
        switch (syn){
            case '1':
                func1();
                break;
            case '2':
                func2();
                break;
            default :
                //console.log("请重新输入！");
                //$this.choice_crawler(func1,func2);
                break;
        }
    });

}
choice.prototype.choice_search = function(func){
    var $this =this;
    var url = "http://www.pixiv.net/search.php?s_mode=s_tag";
    var word = "&word=";
    var condition = "users入り";
    console.log("请输入查找关键词：");
//    async.waterfall([function(callback){
//        util.readSyn(function(wordSyn) {
//            word = word + wordSyn + ' ';
//            console.log("请选择查找人气类型:\n50,100,300,1000,5000,10000(全部则为空)");
//            callback(null);
//        });
//    }],function(err,res){
//        util.readSyn(function(Syn){
//            var numbers = ['50','100','300','500','1000','5000','10000',''];
//            for(var i in numbers){
//                if(numbers[i]==Syn){
//                    console.log(url+word+condition);
//                    func(url+word+condition);
//                }
//            }
//        });
//    });
    util.readSyn(function(wordSyn){
        console.log("choice_search1")
        word=word+wordSyn+' ';
        console.log("请选择查找人气类型:\n50,100,300,1000,5000,10000(全部则为空)");
        util.readSyn(function(Syn){
            var numbers = ['50','100','300','500','1000','5000','10000',''];
            for(var i in numbers){
                if(numbers[i]==Syn){

                    func(url+word+Syn+condition,wordSyn+Syn);
                    return;
                }
            }
            //console.log("输入错误请重新输入：");
            //$this.choice_search();
        });
    });

}
exports.choice = new choice();
