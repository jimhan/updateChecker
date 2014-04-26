/**
 * Created by dev on 14-4-6.
 */
var backGround = chrome.extension.getBackgroundPage();
document.addEventListener('DOMContentLoaded', function (){


//    localStorage.totalUrl = "http://www.huihui.cn/,";
//    localStorage.urlList = JSON.stringify({"http://www.huihui.cn/":{"keyboard":"","class":""}});


    if(localStorage.status=="start")$("#status").text("运行中");
    else if(localStorage.status=="stop")$("#status").text("已停止");
    $("#time").val(localStorage.time/60000);

    if(localStorage.desktopAlert=="true")
    {
        $("#desktopAlert").attr("checked","checked");
        $("#desktopAlert").attr("keeper","true");
    }

    urlToDelete = [];

    //加载添加到检查页面的url和关键词
    if(localStorage.urlList != undefined)
    {
        var urlList = JSON.parse(localStorage.urlList);
        var links = localStorage.totalUrl.split(",");
        var count = 0;
        while((links[count]!="")&&(links[count]!=undefined))
        {
            var link = links[count];
            var li = document.createElement('li');
            //$(li).attr("id",count);
            var p = document.createElement('p');
            p.innerHTML = links[count];

            var label = document.createElement('label');
            label.innerHTML = "关键词:";

            var input = document.createElement('input');
            $(input).attr("placeholder","关键词用空格分隔");
            $(input).attr("class","form-control");
            $(input).attr("style","width:200px");
            $(input).val(urlList[link].keyword);
            $(input).attr("keeper",urlList[link].keyword);

            var button = document.createElement('input');
            $(button).attr("type","button");
            $(button).attr("value","X");
            $(button).attr("class","btn btn-xs btn-danger");

            p.appendChild(button);

            var hr = document.createElement("hr");

            li.appendChild(p);
            li.appendChild(label);
            li.appendChild(input);
            //li.appendChild(button);
            var parent = document.getElementById("setKeyword");
            parent.appendChild(li);
            parent.appendChild(hr);
            count++;
        }
        //$("#setKeyword").attr("count",count);

    }

    //加载概述页面的match
    if(localStorage.matchCount>0)
    {
        var matchList = JSON.parse(localStorage.match);
        var count = localStorage.matchCount;
        var parent = document.getElementById("matchList");
        for(var i=count-1;i>=0;i--)
        {
            var li = document.createElement("li");
            
            var a = document.createElement("a");
            //$(a).attr("target","_blank");
            $(a).attr("href",matchList[i].link);
            $(a).attr("id",i);
            a.innerHTML = "匹配关键词“"+matchList[i].keyword+"”的链接";
            if(matchList[i].clicked)$(a).attr("style","color:purple;");
            //$(a).attr("onclick","setClicked("+i+")");

            li.appendChild(a);

            parent.appendChild(li);
        }
    }


    $("#start").click(function(){
        $("#status").text("运行中");
        backGround.startLook();
    });

    $("#stop").click(function(){
        $("#status").text("已停止");
        backGround.stopLook();
    });

    $("#set").click(function(){

        var timeMin = $("#time").val();

        if(timeMin<1)
        {
            //设置提醒语句
            $("#alertS").html("时间间隔请大于1分钟");
            return;
        }

        var data = {"time":timeMin*60000};

        //var list = document.getElementById("setKeyword").childNodes;
        var pageUrls = $("#setKeyword").children("li");
        var count = pageUrls.length;
        if(count==0)
        {
            $("#alertS").html("请先添加待定时检查的链接");
            return;
        }

        //检查桌面开启按钮是否有变化
        var desktopAlert = document.getElementById("desktopAlert").checked+"";
        if(desktopAlert!=($("#desktopAlert").attr("keeper")))
        {
            localStorage.desktopAlert = desktopAlert;
        }

        //检查是否删除了要检查的url
        if(urlToDelete.length>0)
        {
            for(var i=0;i<urlToDelete.length;i++)
            {
                backGround.deleteData("ONEURL",urlToDelete[i]);
            }

        }

        // 检查有哪个产生了变化，再发送
        var k = 0;
        for(var i=0;i<count;i++)
        {
            var keywordNow = $(pageUrls[i]).children("input").val();
            var keywordPast = $(pageUrls[i]).children("input").attr("keeper");
            if(keywordNow!=keywordPast)
            {
                data[k] = {"pageUrl":$(pageUrls[i]).children("p").text(),"keyword":keywordNow};
                k++;
            }

        }

        backGround.set(data);

        $("#alertS").empty();
        var date = new Date();
        $("#setStatus").html("设置成功（"+date.getHours()+":"+date.getMinutes()+")");
    });

    $("#claerMatch").click(function(){

        backGround.clearMatch();
        $("#matchList").empty();

    });

    //先将已匹配的链接设为已经点击过，再跳转
    $("#matchList a").click(function(){

        var id = $(this).attr("id");
        backGround.setLinkClicked(id);
        var link = $(this).attr("href");
        window.open(link);
    });

    //删除要检查的url
    $("#setKeyword li p input").click(function(){

        var url = $(this).parent().text();
        var count = urlToDelete.length;
        urlToDelete[count] = url;
        //backGround.deleteData("ONEURL",url);
        $(this).parent().parent("li").remove();

    });

    //即时设置 是否桌面提醒
//    $("#desktopAlert").click(function(){
//
//        var judge = document.getElementById("desktopAlert").checked+"";
//
//        //var judge = $("#desktopAlert").attr("checked")+"";
//        if(judge=="true")localStorage.desktopAlert="true";
//        else localStorage.desktopAlert = "false";
//
//    });



//    $("#setting").submit(function(e){
//        var url = $("#urlInput").value;
//        backGround.addUrl(url);
//
//    });
//    $("#submit").click(function(){
//        var url = $("#urlInput").val();
//        backGround.addUrl(url);
//    });


});


//删除检查列表中的单个url
function deleteUrl(pageUrlI)
{
    var pageUrl = pageUrlI;
    backGround.deleteData("ONEURL",pageUrl);
    $(this).parent().parent("li").remove();
}

