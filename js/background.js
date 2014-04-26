
//保存打开的检查窗口的tabId
var openWindows = {};
var openWindowsCount = 0;

//保存检查url和打开窗口id的对应，方便及时重新请求新数据
var urlToTabId = {};

//var countUrl = 0;

if(localStorage.time==undefined||localStorage.time=="")
{
    localStorage.time = 60000;//1000毫秒=1s
}

if(localStorage.status=="start")
{
    startLook();
}
chrome.contextMenus.create({
    "title":"添加到UpC",
    "contexts":["link"],
    "onclick":addUrlToCheck

});


document.addEventListener('DOMContentLoaded', function (){


    chrome.extension.onRequest.addListener(function(dataI,sender) {

        var data = JSON.parse(dataI);

        if((data.kind=="CHECK")&&(localStorage.status=="start"))//待检查页面的初始化
        {
            var pageUrl = data.pageUrl;

            if(localStorage.totalUrl.indexOf(pageUrl)>=0)
            {
                //非插件打开的网页，所请求的信息一概不回
                if((urlToTabId[pageUrl])==(sender.tab.id))
                {
                    var urlList = JSON.parse(localStorage.urlList);
                    var response = urlList[pageUrl];
                    response["time"] = localStorage.time;
                    response["kind"] = "CHECK_response";
                    //把数据发回去
                    chrome.tabs.sendRequest(sender.tab.id, JSON.stringify(response));
//                openWindows[openWindowsCount] = sender.tab.id;
//                openWindowsCount++;

                }
            }

        }
        else if(data.kind=="ADD")
        {
            addUrl(data,sender.tab.id);
        }
        else if(data.kind=="ADDMATCH")
        {
            var urlList = JSON.parse(localStorage.urlList);
            (urlList[data.pageUrl]).nMatchLink = data.nMatchLink;

            var tempCount = data.count;
            var match = JSON.parse(localStorage.match);
            var matchCount = localStorage.matchCount;
            for(var i=0;i<tempCount;i++)
            {
                match[matchCount] = data[i];
                matchCount++;
            }
            localStorage.match = JSON.stringify(match);
            localStorage.matchCount = matchCount;
            localStorage.urlList = JSON.stringify(urlList);
            chrome.browserAction.setBadgeText({"text":localStorage.matchCount});

            //如果桌面提醒为真，则弹出提醒
            if(localStorage.desktopAlert=="true")desktopAlert(data);



        }
    });
});


//////////////////////////////////分割----下面是方法的定义//////////////



function startLook()
{
    //if(localStorage.status=="start")return;

    //如果已经打开该页面了，是否还要再打开，如何才能不打开

    var totalUrl = localStorage.totalUrl.split(",")
    var count = 0;
    var timer = null;

    //todo 检查urlToTabId中是否有的标签被关掉了，有则重新打开，如果都在则什么都不做
    if(localStorage.status=="start")
    {
//        for(var i=0;i<totalUrl.length;i++)
//        {
//            var url = totalUrl[i];
//            if(urlToTabId[url]!=undefined)
//            {
//                //检查是否被关掉了
//                var tabId = urlToTabId[url];
//                var test = chrome.tabs.get(tabId,function(tab){
//
//                    if(tab==undefined)
//                    {
////                        chrome.tabs.create({"active":false,"url":url},function(tab){
////                            openWindows[openWindowsCount] = tab.id;
////                            //console.log("back_"+tab.id);
////                            openWindowsCount++;
////                            urlToTabId[tab.url]=tab.id;
////                        });
//
//                        console.log(tabId+"error");
//
//                    }
//
//                    console.log("tabId+"+tab.id);
//
//                });
//
//
//            }
//
//
//
//        }
//        return;
        stopLook();

    }

    while(totalUrl[count]!=""&&totalUrl[count]!=undefined)
    {
        //var tempWindow = window.open(totalUrl[count],totalUrl[count]);

//        openWindows[openWindowsCount] = tempWindow;
//        openWindowsCount++;
        //tempWindow = null;
        var pageUrl = totalUrl[count];
        chrome.tabs.create({"active":false,"url":pageUrl},function(tab){

            openWindows[openWindowsCount] = tab.id;
            console.log("back_"+tab.id);
            openWindowsCount++;
            var tabUrl = tab.url;
            if(urlToTabId[tabUrl]==undefined)
            {
                console.log(tab.url+":"+tab.id+";");
                urlToTabId[tabUrl]=tab.id;
            }

        });

        count++;
        //随机暂停1秒内
        timer = setTimeout("",Math.ceil(Math.random()*1000));

    }

    //clearTimeout(timer);

    localStorage.status = "start";


//    for(var i=0;i<openWindowsCount;i++)
//    {
//        chrome.tabs.sendRequest(openWindows[i], JSON.stringify({"kind":"START"}));
//
//    }

    //获取存在localStorage中的抓取时间设置

    //startLoop();

}


function stopLook()
{
    //clearTimeout(timer);
    localStorage.status="stop";
    //
    //chrome.tabs.executeScript(null,{code:"document.getElementById('status').innerHTML='back-stop';"});

    for(var i=0;i<openWindowsCount;i++)
    {
//        var tempWindow = openWindows[i];
//        tempWindow.close();
//        tempWindow = null;
        //temp
        chrome.tabs.remove(openWindows[i]);
        console.log("close tab id:"+openWindows[i]);
        //chrome.tabs.sendRequest(openWindows[i], JSON.stringify({"kind":"CLOSE"}));
    }
    openWindows = {};
    openWindowsCount = 0;
    urlToTabId = {};

}

function addUrl(data,tabId)
{
    var pageUrl = data.pageUrl+"";
    var commonClass = data.commonClass;
    var struct = data.struct;
    if(pageUrl==null||pageUrl=="")return;
    if(localStorage.urlList==null||localStorage.urlList=="")//新建
    {

        var jsonObject= new Object();
        jsonObject[pageUrl] = {"pageUrl":pageUrl,"class":commonClass,"struct":struct,"keyword":"","nMatchLink":""};
        localStorage.urlList = JSON.stringify(jsonObject);// jsonObject;
        localStorage.totalUrl = pageUrl+",";
        localStorage.matchCount = 0;
        localStorage.match = JSON.stringify({});
        localStorage.desktopAlert = "false";
        //localStorage.checkWhenOpen = false;


    }
    else//在原有的基础上增加
    {
        var jsonObject =  JSON.parse(localStorage.urlList);
        if(typeof jsonObject[pageUrl] == "undefined")
        {
            jsonObject[pageUrl] = {"pageUrl":pageUrl,"class":commonClass,"struct":struct,"keyword":"","nMatchLink":""};
            localStorage.urlList = JSON.stringify(jsonObject);
            localStorage.totalUrl = localStorage.totalUrl+pageUrl+",";

        }
        else
        {
            //修改原有的 class struct 例如相同的网页监控不同的链接
            jsonObject[pageUrl] = {"pageUrl":pageUrl,"class":commonClass,"struct":struct,"keyword":"","nMatchLink":""};
            localStorage.urlList = JSON.stringify(jsonObject);

        }

    }

    if((localStorage.status=="start")&&(urlToTabId[pageUrl]==undefined))//新添加的的url，还未设置关键词
    {
        openWindows[openWindowsCount] = tabId;
        openWindowsCount++;
        urlToTabId[pageUrl] = tabId;
    }


    //window.location.reload(); 等设置好关键词再reload
}

function set(data)//设置关键词和抓取时间间隔
{
    var urlList = JSON.parse(localStorage.urlList);
    //stopLook();
    var time = data.time;
    var totalReload = false;
    if(time!=localStorage.time)
    {
        totalReload = true;
        localStorage.time = time;
    }

    //localStorage.checkWhenOpen = data["checkWhenOpen"];

    var count = 0;
    while(data[count]!=undefined)
    {
        var pageUrl = data[count].pageUrl;
        urlList[pageUrl].keyword = data[count].keyword;
        count++;
    }
    localStorage.urlList = JSON.stringify(urlList);

    //window.location.reload();
    if(localStorage.status=="start")
    {
        if(totalReload)
        {
            // 向所有打开的tab发送消息 如果没有对应id则新建打开
            var totalUrl = localStorage.totalUrl.split(",");
            var count = 0;
            while(totalUrl[count]!=""&&totalUrl[count]!=undefined)
            {
                var pageUrl = totalUrl[count];
                if(urlList[pageUrl].keyword=="")
                {
                    count++;
                    continue;
                }
                if(urlToTabId[pageUrl]!=undefined)
                {
                    //发送重载消息
                    chrome.tabs.sendRequest(urlToTabId[pageUrl], JSON.stringify({"kind":"RESET"}));

                }
                else
                {
                    // 新建标签 加入到urlToTabId
                    chrome.tabs.create({"url":pageUrl},function(tab){

                        openWindows[openWindowsCount] = tab.id;
                        openWindowsCount++;
                        urlToTabId[pageUrl] = tab.id;

                    });


                }
                count++;
            }
        }
        else if(count>0)
        {
            // 打开窗口或新建窗口
            var count = 0;
            while(data[count]!=undefined)
            {
                var pageUrl = data[count].pageUrl;

                if(urlToTabId[pageUrl]!=undefined)
                {
                    // 取tabId 重载
                    chrome.tabs.sendRequest(urlToTabId[pageUrl], JSON.stringify({"kind":"RESET"}));
                }
                else
                {
                    // 新建
                    chrome.tabs.create({"url":pageUrl},function(tab){

                        openWindows[openWindowsCount] = tab.id;
                        openWindowsCount++;
                        var pageUrl = tab.url;
                        if(urlToTabId[pageUrl]==undefined)urlToTabId[pageUrl] = tab.id;

                    });

                }
                count++;
            }
        }
    }



}

function addUrlToCheck(info,tab)
{
    var data = {"kind":"ANALYSE","link":info.linkUrl,"pageUrl":info.pageUrl};
    chrome.tabs.sendRequest(tab.id, JSON.stringify(data));

}

function clearMatch()
{
    localStorage.match = JSON.stringify({});
    localStorage.matchCount = 0;
    chrome.browserAction.setBadgeText({"text":""});
}

function deleteData(kind,pageUrl)
{
    if(kind=="ONEURL")
    {

        var urlList = JSON.parse(localStorage.urlList);

        urlList[pageUrl] = undefined;
        //urlList.splice(id,1);
        localStorage.urlList = JSON.stringify(urlList);

        var totalUrl = localStorage.totalUrl.split(",");
        var newTotalUrl = "";
        var count = 0;
        while(totalUrl[count]!=""&&totalUrl[count]!=undefined)
        {
            if(totalUrl[count]!=pageUrl)
            {
                newTotalUrl = totalUrl[count]+","+newTotalUrl;
                count++;
            }
            else
            {
                count++;
            }

        }
        localStorage.totalUrl = newTotalUrl;
        urlToTabId[pageUrl]=undefined;
    }

}

function setLinkClicked(id)
{
    var matchList = JSON.parse(localStorage.match);
    matchList[id].clicked = true;
    localStorage.match = JSON.stringify(matchList);

//    if(localStorage.matchCount==0)chrome.browserAction.setBadgeText({"text":""});
//    else chrome.browserAction.setBadgeText({"text":localStorage.matchCount});
}

function desktopAlert(data)
{

    var notification = webkitNotifications.createNotification(
        'image/icon.png',  // 图标 URL，可以是相对路径
        '新找到了 '+data.count+' 个链接',  // 通知标题
        '最新的链接匹配 '+data[0].keyword // 通知正文文本
    );

    notification.show();
}




//
//function lookFor()
//{
//
//    window.location.reload(true);
//
//    var count = 0;
//    var pageUrls = localStorage.totalUrl.split(",");
//    var urlList = JSON.parse(localStorage.urlList);
//    var match = JSON.parse(localStorage.match);
//    while(pageUrls[count])
//    {
//        var newest = true;//第一个符合关键词的要记录下来，如果下次再遇到直接跳过
//
//        pageUrl = pageUrls[count];
//        var keywords = urlList[pageUrl].keyword.split(",");
//        if(keywords.length<2)//该url未设置关键词，匹配个毛线
//        {
//            count++;
//            continue;
//
//        }
//        //获得框架内的链接列表
//        var links = "";//$("iframe[src="+pageUrl+"]"+urlList[pageUrl].class+urlList[pageUrl].struct);
//
//        for(var i=0;i<links.length;i++)//检查每个iframe的链接
//        {
//
//            var link = links[i].innerHTML.toString();
//            var k = 0;
//            while(keywords[k]!=""&&typeof keywords[k]!= "undefined")//对每个链接用不同的关键词去匹配
//            {
//                if(link.search(keywords[k])>0)//符合关键词要求
//                {
//                    if(link[i].href!=urlList.pageUrl.nMatchLink)
//                    {
//                        if(newest)
//                        {
//                            urlList.pageUrl.nMatchLink = link[i].href;
//                            newest = false;
//                        }
//
//                        //将关键词和对应link添加到 localStorage 以便popup弹出时添加
//                        match[localStorage.matchCount] = JSON.stringify({"keyword":keywords[k],"link":link[i].href,"clicked":false});
//                        localStorage.matchCount = localStorage.matchCount++;
//                    }
//                    else
//                    {
//                        break;
//                    }
//
//                }
//                else k++;
//            }
//
//        }
//
//        count++;
//
//    }
//    localStorage.urlList = JSON.stringify(urlList);
//    localStorage.match = JSON.stringify(match);
//    if(localStorage.matchCount>0)chrome.browserAction.setBadgeText({"text":localStorage.matchCount});
//    urlList = null;
//    match = null;
//
//}
//todo 等php端开发好了就能用了
//function get(url,callback)
//{
//    var request = new XMLHttpRequest();// new request
//    request.open("GET",url,false);
//    request.send();
//    request.onreadystatechange = function(){
//        if(request.readyState === 4 && request.status === 200 )
//        {
//            var type = request.getResponseHeader("Content-Type");
//            if(type == "text/html")
//            {
//                callback(request.responseText);
//            }
//        }
//
//    }
//
//}

//获取前台页面
//function getFrontPage()
//{
//    var viewTabUrl = chrome.extension.getURL('main.html');
//    // Look through all the pages in this extension to find one we can use.
//    var views = chrome.extension.getViews();
//    for (var i = 0; i < views.length; i++) {
//        var view = views[i];
//        // If this view has the right URL and hasn't been used yet...
//        if (view.location.href == viewTabUrl) {
//
//            // ...call one of its functions and set a property.
//
//            //break; // we're done
//            return view;
//        }
//    }
//    return null;
//}