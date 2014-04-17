/**
 * Created by dev on 14-4-8.
 *
 * 用于插入当前页面，
 *
 * 响应右键对元素的选取
 *
 * 向background.js发送消息
 */
var urlKeeper = {};
var count = 0;
var pageUrl = window.location.href;
var timer;
var random;


//document.addEventListener('DOMContentLoaded', function (){
//
//
//
//
//
//});

chrome.extension.onRequest.addListener(function(dataI) {

    var data = JSON.parse(dataI);

    if(data.kind=="CHECK_response")
    {
        //readyToCheck = true;
        checkKeyword(data);
        //localStorage.UpC_checkerCondition = data;

    }
    else if(data.kind=="ANALYSE")
    {
        //判断，如果urlKeeper中已经有了一个url，则开始分析，
        //收到一个信息，先把该link在dom中找出来，高亮标注
        //由用户来点击 开始判断分析 在popup中设置关键词

        if(count==0)
        {
            pageUrl = data.pageUrl;
            urlKeeper[count]={"link":data.link,"obj":""};
            count++;
            return;

        }
        else if(count==1)
        {
            urlKeeper[count]={"link":data.link,"obj":""};
            count++;

            //将选中的link高亮表示
            //分析两个link，
            var pageLinks = document.getElementsByTagName("a");
            var PLC = 0;
            var UKC = 0;
            while((pageLinks[PLC]!=undefined )&&(urlKeeper[UKC]!=undefined))
            {
                if(pageLinks[PLC].href==urlKeeper[UKC].link)
                {
                    urlKeeper[UKC].obj = pageLinks[PLC];
                    pageLinks[PLC].style.backgroundColor = "#FFCC80";
                    UKC++;
                    PLC = -1;//对下个链接重头开始检索
                }
                PLC++;
            }
            pageLinks = null;
            //开始分析
            var data = analyseW();
            data["pageUrl"]=pageUrl;
            //将pageUrl、struct、commonClass 发给background.js 由bg写到localstorage，popup自动加载
            data["kind"] = "ADD";
            chrome.extension.sendRequest(JSON.stringify(data));
        }
        else
        {
            urlKeeper[count]={"link":data.link,"obj":""};
            count++;
        }
    }
    else if(data.kind=="RELOAD")
    {
        window.location.reload();

    }
    else if(data.kind=="RESET")//重新设置新的关键词或时间
    {
        //localStorage.removeItem("UpC_checkerCondition");
        window.location.reload();
    }
//    else if(data.kind=="CLOSE")
//    {
//        //localStorage.removeItem("UpC_checkerCondition");
//        //chrome.tabs.remove(data.tabId);
//        window.close();
//    }

});
//先把接受信息的打开，再发送消息
//if(localStorage.UpC_checkerCondition==undefined||localStorage.UpC_checkerCondition=="")
//{
//    var data = {"pageUrl":pageUrl,"kind":"CHECK"}
//    chrome.extension.sendRequest(JSON.stringify(data));
//}
//else
//{
//    //readyToCheck = true;
//
//
//}


    chrome.extension.sendRequest(JSON.stringify({"kind":"CHECK","pageUrl":pageUrl}));

//暂时写死，只分析前两个  循环版
function analyseW()
{
    var link_1 = urlKeeper[0].obj;
    var link_2 = urlKeeper[1].obj;
    var struct = ""; //這個值有可能是空值 要用的時候注意
    var commonClass = "";

    while(typeof link_1.parentNode != "undefined")
    {
        if((link_1.className != "")&&(link_1.className == link_2.className))
        {
            commonClass = "."+link_1.className;
            break;
        }
        else if(link_1==link_2)//两个子节点到达同个父节点（没class的父节点）
        {
            commonClass = link_1.nodeName;
            break;
        }
        else
        {
            struct = " " + link_1.nodeName + struct;
            link_1 = link_1.parentNode;
            link_2 = link_2.parentNode;
        }

    }
    if(commonClass.indexOf(" ")>0)//当class中有空格时，jquery解析不出来，只好取第一个
    {
        commonClass = commonClass.split(" ")[0];
    }
    return {"struct":struct,"commonClass":commonClass};

}

//扫描页面上是否有匹配关键词的链接，找到了便和newMatch比较，不是则发给bg.js
function checkKeyword(data)
{


    var newest = true;//第一个符合关键词的要记录下来，如果下次再遇到直接跳过
    var match = {};
    var matchCount = 0;
    var keywords = data.keyword.split(" ");
    if(data.keyword.replace(/ /g,"")==0)//该url未设置关键词，匹配个毛线
    {
        return;
    }
    //获得框架内的链接列表
    //var links = "";//$("iframe[src="+pageUrl+"]"+urlList[pageUrl].class+urlList[pageUrl].struct);

    var links = $(data.class+" "+data.struct);
    var count = 0;
    var lastNewLink = data.nMatchLink;
    while(links[count]!=""&&links[count]!=undefined)
    {
        var linkString = links[count].innerHTML;
        //var k = 0;
        for(var k=0;k<keywords.length;k++)//keywords[k]!=""&&typeof keywords[k]!= "undefined")//对每个链接用不同的关键词去匹配
        {
            if(keywords[k]=="")continue;
            if(linkString.search(keywords[k])>=0)//符合关键词要求
            {
                if(links[count].href!=lastNewLink)
                {
                    if(newest)
                    {
                        data.nMatchLink = links[count].href;
                        newest = false;
                    }

                    //将关键词和对应link添加到 localStorage 以便popup弹出时添加
//                  match[localStorage.matchCount] = JSON.stringify({"keyword":keywords[k],"link":link[i].href,"clicked":false});
//                  localStorage.matchCount = localStorage.matchCount++;
                    match[matchCount] = {"keyword":keywords[k],"link":links[count].href,"clicked":false};
                    matchCount++;

                }
                else
                {
                    break;
                }


            }
        }

        if(links[count].href==undefined||links[count].href=="")
        {
            count++;
            continue;
        }
        if(links[count].href==lastNewLink)
        {
            break;
        }
        count++;

    }

    //将匹配到的链接发给bg
    if(matchCount>0)
    {
        if(!newest)
        {
            match["pageUrl"] = data.pageUrl;
            match["nMatchLink"] = data.nMatchLink;
        }

        match["count"] = matchCount;
        match["kind"] = "ADDMATCH";
        chrome.extension.sendRequest(JSON.stringify(match));

    }

    localStorage.UpC_checkerCondition = JSON.stringify(data);

    // 随机等5秒
    random = Math.ceil(Math.random()*5000);
    timer = setTimeout("",random);

    //计时之后重新载入网页
    var timer = setTimeout(function(){
        window.location.reload();
    },data.time-5);

}


//暂时写死，只分析前两个  递归版
//function analyseD()
//{
//    var link_1 = urlKeeper[0].obj;
//    var link_2 = urlKeeper[1].obj;
//    var struct = ""; //這個值有可能是null 要用的時候注意
//    var commonClass = null;
//
//    if((link_1.className != "")&&(link_1.className == link_2.className))
//    {
//        commonClass = link_1.className;
//    }
//    else
//    {
//        //递归求相同的class 和struct  返回一个json对象；
//        var temp = getSameClass(link_1,link_2);
//        struct = temp.struct;
//        commonClass = temp.commonClass;
//
//    }
//    if(commonClass.indexOf(" ")>0)//当class中有空格时，jquery解析不出来，只好取第一个
//    {
//        commonClass = commonClass.split(" ")[0];
//    }
//    return {"struct":struct,"commonClass":commonClass};
//
//}

//递归求相同的class 和struct  返回一个json对象；
//function getSameClass(link_1I,link_2I)
//{
//    var struct = link_1I.nodeName;
//    var commonClass = null;
//
//    var link_1 = link_1I.parentNode;
//    var link_2 = link_2I.parentNode;
//
//    if((link_1.className != "")&&(link_1.className == link_2.className))
//    {
//        commonClass = link_1.className;
//    }
//    else
//    {
//        //递归求相同的class 和struct  返回一个json对象；
//        var temp = getSameClass(link_1,link_2);
//        struct = temp.struct + " " + struct;
//        commonClass = temp.commonClass;
//
//    }
//
//    return {"struct":struct,"commonClass":commonClass};
//
//}

