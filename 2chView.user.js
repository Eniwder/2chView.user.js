// ==UserScript==
// @name        2chを使いやすく
// @namespace   Eniwder
// @include     http://*.2ch.net/test/read.cgi/*
// @include     http://*.shitaraba.net/bbs/read.cgi/*
// @version     1.82
// @grant       none
// ==/UserScript==
/////////////
// 汎用定義 //
/////////////
function $id(id) { return document.getElementById(id) }
function $tag(tagName){ return document.getElementsByTagName(tagName) }
function $name(name){ return document.getElementsByName(name) }
function $class(className){ return document.getElementsByClassName(className) }

////////////////////////////
// 埋め込みScript用関数たち //
///////////////////////////

function refpop(p){   // レス参照ポップアップ
        $class("thread")[0].appendChild(createPopDiv($id(p.toString().match(/.+#([0-9]+)/)[1]).innerHTML));
}
function idpop(id){   // ID参照ポップアップ
    var contents = "";
    var idress = $class(id);
    for(var i=0;i<idress.length;i++)contents += "<div>" + idress[i].innerHTML + "</div>";    
    var ne = createPopDiv(contents);
    ne.style.left="200px";
    $class("thread")[0].appendChild(ne);
}
function allRefpop(refs){   // ID参照ポップアップ
    var refsArray = refs.split(",")
    var contents = "";
    for(var i=0;i<refsArray.length;i++)contents += "<div>" + $id(refsArray[i]).innerHTML + "</div>";    
    var ne = createPopDiv(contents);
    $class("thread")[0].appendChild(ne);
}
function extract(b){   // 人気レス抽出
    var resIdRegx = /[0-9][0-9]?[0-9]?/    
    var divs = $tag("div")
    if(b.value=="抽出解除"){
        for(var i=0;i<divs.length;i++){
            if(!resIdRegx.test(divs[i].id)) continue;
            divs[i].style.display = "block";
        }
        b.value="人気抽出"
    }else{
        for(var i=0;i<divs.length;i++){
            if(!resIdRegx.test(divs[i].id)) continue;
            if(!divs[i].getAttribute("extTrg")) divs[i].style.display = "none";
        }
        b.value="抽出解除"
    }
}
function onMouseMove (e) {
    mx = e.clientX;
    my = e.clientY;
}
//   キー入力で書き込み欄を出そうと思ったけどモチベ出ず
//    document.addEventListener("keydown", onKeyDown);
//    function onKeyDown (e) {
//        alert(e.ctrlKey + "<>"+ e.altKey);
//        my = e.clientY;
//    }
function createPopDiv(contents) {   // ポップアップDIV作成用
    var ne = document.createElement("div");
    ne.innerHTML = contents;
    ne.style.position="absolute";
    ne.style.maxHeight="480px";
    ne.style.overflow="scroll";
    ne.style.opacity="0.8";   // ポップアップの透過度
    ne.setAttribute("class","created");
    ne.setAttribute("onClick","delPop(this)");
    ne.style.left=mx+document.body.scrollLeft+50+"px";   // ポップアップの位置X
    ne.style.top=my+document.body.scrollTop-100+"px";         // ポップアップの位置Y
    return ne;
}
function writeRes(n) {   // 返信レス書き込み補助
    $name("MESSAGE")[0].value+=">>"+n+"\r\n";
}
function delPop(p) {   // ポップアップ削除
    $class("thread")[0].removeChild(p);
}

document.addEventListener("mousemove", onMouseMove);   // ポップアップ用の座標取得、その時だけにしたい…
var methods = "var mx,my;" + $id + $name + $tag + $class + 
             refpop + idpop + allRefpop + 
             extract + onMouseMove + createPopDiv +
             writeRes + delPop + 'document.addEventListener("mousemove", onMouseMove);';
var scElem = document.createElement("script");		// Scriptタグを生成
scElem.appendChild(document.createTextNode(methods));
document.body.appendChild(scElem);

//////////////////
// 普通のScript ///
/////////////////

// スレ欄をよく使うので変数化
var thread = $class("thread")[0];

// 書き込み欄の設定
writeAreaSetting();

// IDごとのレスを記憶する
var resOfId = {};   

// dt,ddをdivにする
dtDd2Div($tag('dt'),$tag('dd'))

// レス参照配列初期化
var recvRef = [];
for(var i=0;i<1000;i++) recvRef[i] = [];
// a要素を色々置換
aElemReplace($tag('a'));

// 上で記憶しといた参照先を使って、被レス機能実装、適当に赤くなる
divElemReplace($tag('div'));   // for-eachしたかったけど、何故か最後に謎の要素が入ってバグったので普通のループに…


// 書き込み欄の設定
function writeAreaSetting(){
    // 過去ログの時にエラー回避
    if(!$tag('form')[0]) return;
    
    // ページロード時に書き込み欄の初期化と、書き込み欄を折り返し表示に
    var writeText = $name("MESSAGE")[0];
    writeText.value = "";
    writeText.wrap = "soft";
    
    // フォーム遷移先を新たに作成したiframeに変更
    var writeform = $tag('form')[0]
    writeform.setAttribute("target","writeResult");
    var ifEle = document.createElement("iframe");
    ifEle.setAttribute("id","writeFrame");
    ifEle.setAttribute("name","writeResult");
    
    // 中身クリアボタン設置
    var clearButton = document.createElement("input");
    clearButton.setAttribute("type","button");
    clearButton.setAttribute("value","clear");
    clearButton.setAttribute("onclick","$name(\"MESSAGE\")[0].value=\"\"");
    clearButton.style.margin="0px 0px 0px 5px";
    writeform.insertBefore(clearButton,$name('mail')[0].nextSibling);
    
    // 赤レス抽出ボタン設置
    var extractButton = document.createElement("input");
    extractButton.setAttribute("type","button");
    extractButton.setAttribute("value","人気抽出");
    extractButton.setAttribute("onclick","extract(this)");
    extractButton.style.margin="0px 0px 0px 5px";
    writeform.insertBefore(extractButton,$name('mail')[0].nextSibling);
    
    // フォームとiframeをDivでラップ
    var writeDiv = document.createElement("div");
    writeDiv.setAttribute("id","writeDiv");
    writeDiv.style.opacity=0.1; // 書き込み欄を基本透過にしておく
    writeDiv.setAttribute("onmouseover","this.style.opacity=\"1\"");
    writeDiv.setAttribute("onmouseout","this.style.opacity=\"0.1\"");
    writeDiv.appendChild(writeform);
    writeDiv.appendChild(ifEle);
    thread.appendChild(writeDiv);

}

// レスをdt,ddからdivに変更
// メ欄の削除、ttp→http
function dtDd2Div(dts,dds){
    var idRegex = /ID:([0-9A-z\+\/\?]+)/;
    var AARegex = /　 (?!<br>|$)/i;
    var resNumber = /([0-9]+)/;
    var mail = /\<a href="mailto:(.*)"\>(.+)：/ 
    for(var i = 0, resLen = dts.length; i < resLen; i++){
        var id = dts[i].innerHTML.match(idRegex) ? dts[i].innerHTML.match(idRegex)[1] : "null";
        if(!resOfId[id])resOfId[id] = 0;
        resOfId[id]++;   // IDにDIV要素を記憶
        var aaclass = AARegex.test(dds[i].innerHTML) ? " AA" : ""　;
        var div = document.createElement("div");
        div.innerHTML = dtDd2Str(dts[i],dds[i]);
        div.setAttribute("id",dts[i].innerHTML.match(resNumber)[1]);
        div.setAttribute("class",id+aaclass);            // IDでグルーピング
        div.setAttribute("nOfId",resOfId[id]);   // 何個目の書き込みか記憶しておく
        thread.appendChild(div);
    }

    // DIV化されたdtとかを削除
    for(var i = 0; i < resLen; i++){
        thread.removeChild(dts[0]);
        thread.removeChild(dds[0]);
    }

    // dt,ddの中身を文字列にして返す、その際に色々加工
    function dtDd2Str(dt,dd){
        return dt.innerHTML.replace(resNumber,"<span onclick=writeRes('$1')>$1</span>")
        .replace(mail,"$2[$1]：") + "<br>"
        + dd.innerHTML.replace("<br><br>\n","<br>")
        .replace(/[^h](ttp:\/\/.+\.(jpg|jpeg|png|gif))/g,"<a href=\"h$1\">h$1</a>");
    }
}

// リンク要素の置換
// レス参照のポップアップ、クッションページ削除、画像・動画の埋め込み
function aElemReplace(as){
    var board = location.href.match(/test\/read.cgi\/([A-z0-9]+)\/[0-9]+\//)[1]
    var threadNum = location.href.match(/test\/read.cgi\/[A-z0-9]+\/([0-9]+)\//)[1]
    var resref = new RegExp("test\/read.cgi\/"+board+"\/"+threadNum+"\/([0-9]+)")
    var cushionp = "jump.2ch.net/?";
    var imgref = /(jpg|jpeg|png|gif)$/i;
    var tuberef = /http(?:s?):\/\/www\.youtube\.com\/watch\?.*v=([^#]+)/;
    var urlLn = getLn();
    for(var i = 0, alen = as.length; i < alen; i++){ // for-eachしたかったけど、何故か最後に謎の要素が入ってバグったので普通のループに…
        // リンクがレス参照の場合はポップアップにしたり
        var ref = as[i].href.match(resref);
        if(ref && $id(ref[1]) && as[i].parentNode.id){
            if(as[i].parentNode.id<=1000)recvRef[ref[1]].push(as[i].parentNode.id);   // 参照先を記憶しておく
            as[i].setAttribute("onmouseover", "refpop(this)");
            as[i].removeAttribute("target");
            as[i].href = resRefStr(urlLn,board,threadNum,ref[1]);
        }else{
            // クッションページを削除
            if(as[i].href.indexOf(cushionp)!=-1) as[i].href = as[i].href.replace(cushionp,"");
            // 画像、動画(Youtube)を埋め込む
            if(imgref.test(as[i].href)) as[i].innerHTML = imgStr(as[i]);
            else if(tuberef.test(as[i].href))as[i].innerHTML = youtubeStr(as[i]);
        }
    }
       
    // URLのlnの値を取得、ないなら空文字列、getOrElse的なのが欲しい
    function getLn(){
        var ln =location.href.match(/.+(l[0-9]+)/);
        return (ln != null) ? ln[1] : "";
    }
    
    // 参照先レス用のhref文字列を返す
    function resRefStr(ln,b,tn,refn){
        return "../test/read.cgi/"+b+"/"+tn+"/"+ln+"#"+refn;
    }
    
    // 画像埋め込み用の文字列を返す
    function imgStr(a){return "<img src=\""+a.href+"\" height=240px>"}

    // Youtube埋め込み用の文字列を返す
    function youtubeStr(a){
        var path = a.href.match(tuberef)[1].replace(/\&index=[0-9]+/,"").replace(/\&list/,"?list");
        var t = a.href.match(/.+#t=([0-9A-z]+)$/);
        var sec = 0;

        if(t){// 時間指定の処理
            if(t[1].match(/([0-9]+)h.+/))sec += t[1].match(/([0-9]+h.+)/)[1]*60*60;
            if(t[1].match(/(?:[0-9]+h)([0-9]+)m.+/))sec += t[1].match(/(?:[0-9]+h)([0-9]+)m.+/)[1]*60;
            if(t[1].match(/([0-9]+)s$/))sec += t[1].match(/([0-9]+)s$/)[1];
            if(t[1].match(/([0-9]+)$/))sec += t[1].match(/([0-9]+)$/)[1];
        }
        return "<iframe width=\"320\" height=\"240\" src=\"https://www.youtube.com/embed/"+path+"?start="+sec+"\" frameborder=\"0\" allowfullscreen></iframe>";
    }
}

// div要素を色々置換
// 被レスの埋め込み、ID参照のポップアップ
function divElemReplace(divs){
    for(var i = 0, divLen = divs.length; i < divLen; i++){
       if(!divs[i].id || !isFinite(divs[i].id) || divs[i].id>1000 || divs[i].id<0) continue;
       idReplace(divs[i]);
       if(recvRef[divs[i].id].length!=0) recvRefEmbed(divs[i]);
    }
    // 被レスを埋め込む
    function recvRefEmbed(div){
       div.innerHTML+="<br>";
       var color = 0x10*recvRef[div.id].length+0x55;
       if(color > 0xAA)color=0xAA;
       if(recvRef[div.id].length>2) div.setAttribute("extTrg",true);
       div.innerHTML=div.innerHTML.replace(/\>([0-9]+?)\</,">$1 <span onmouseover=allRefpop(\""+recvRef[div.id]+"\")>("+recvRef[div.id].length+")</span><");
       div.innerHTML=div.innerHTML.replace(/\<b\>(.+?)\<\/b\>/,"<b style=\"color:#"+color.toString(16).charAt(0)+"55\">$1</b> ：");    
       for each(res in recvRef[div.id]){
          var href = "\""+location.href+"#"+res+"\"";
          var om ="refpop(this)";
          div.innerHTML += "<a href="+href+"onmouseover="+om+"><<"+res+"</a> ";
       }
    }
    // ID部分を置換
    function idReplace(div){
        var idRegexg = /ID:([0-9A-z\+\/\?]+)/g;
           div.innerHTML=div.innerHTML.replace(idRegexg,idPrint);
        // IDをマウスオーバーでそのIDの書き込みをポップアップするようにする
        function idPrint(str,id,offset,s){
           if(!resOfId[id])return "ID:"+id;
           var ret="";
           var color = (0x10*resOfId[id]+0x45 > 0xAA) ? 0xAA : 0x10*resOfId[id]+0x45;
           if(resOfId[id] == 1 && offset==s.indexOf("ID:")){
               ret =　"ID:"+id;
           }else if(offset==s.indexOf("ID:")){
               ret =　"ID:"+id+"<span onmouseover=idpop(\""+id+"\") style=\"color:#"+color.toString(16).charAt(0)+"55\">("+div.getAttribute("nOfId")+"/"+(resOfId[id])+")</span>";
           }else{
               ret =　"ID:"+id+"<span onmouseover=idpop(\""+id+"\") style=\"color:#"+color.toString(16).charAt(0)+"55\">("+(resOfId[id])+")</span>";
           }
           return ret;
        }
    }
}
