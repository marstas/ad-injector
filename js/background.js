// Respond mode
var testerEnabled = false;
var stm = [], rjs = [], responds = [];
var Tabs = {};
var CurTab = { Id: 0, Url: "" };

function respond1(r) { return handleRespond(0,r); }
function respond2(r) { return handleRespond(1,r); }
function respond3(r) { return handleRespond(2,r); }
function respond4(r) { return handleRespond(3,r); }
function respond5(r) { return handleRespond(4,r); }


function handleRespond(num,res) {
    if (rjs.length && stm.length && testerEnabled) {
        if (rjs[num] === '404') {
            sendMsg(true,num,res,stm[num],rjs[num]);
            return { cancel: true };
        }
        if (isValidUrl(rjs[num])) {
            sendMsg(true,num,res,stm[num],rjs[num]);
            return { redirectUrl: rjs[num] };
        }
        sendMsg(false,num,res,stm[num],rjs[num]);
        return;
    }
}

function sendMsg(success,num,res,s,r) {
    chrome.runtime.sendMessage({type: "respondRuleStatus", success: success, tabId: res.tabId, ruleId: num}, function(a) {});
    responds.push(res.tabId +'-'+ success +'-'+ s +'-'+ r);
    chrome.storage.local.set({responds: responds}, function(a){});
}

function isValidUrl(str) {
    try { new URL(str); return true; }
    catch (ex) { return false; }
}

function clearAllListeners() {
    for (var i = 1; i <= 5; i++) {
        chrome.webRequest.onBeforeRequest.removeListener(eval('respond'+i));
    }
}
clearAllListeners();

chrome.storage.local.get(null, function(r) {
    testerEnabled = r.testerenabled;
    if (r.respondentries) {
        for (var i = 0; i < r.respondentries.length; i++) {
            stm.push(r.respondentries[i].stringToMatch);
            rjs.push(r.respondentries[i].replacementJS);
            chrome.webRequest.onBeforeRequest.addListener(eval('respond'+(i+1)), {urls: ['*://*/*'+ r.respondentries[i].stringToMatch +'*']}, ["blocking"]);
        }
        resetResponds();
    }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.respondentries) {
        stm = []; rjs = [];
        clearAllListeners();
        
        for (var i = 0; i < changes.respondentries.newValue.length; i++) {
            var newString = changes.respondentries.newValue[i].stringToMatch;
            var newRespondJs = changes.respondentries.newValue[i].replacementJS;
            stm.push(newString);
            rjs.push(newRespondJs);
            chrome.webRequest.onBeforeRequest.addListener(eval('respond'+(i+1)), {urls: ['*://*/*'+ changes.respondentries.newValue[i].stringToMatch +'*']}, ["blocking"]);
        }

        for (var j = 0; j < responds.length; j++) {
            var activeString = responds[j].split('-')[2];
            var activeRespondJs = responds[j].split('-')[3];
            if (!stm.includes(activeString) || !rjs.includes(activeRespondJs)) {
                delete responds[j];
                responds = responds.filter(Boolean);
            }
        }
        resetResponds();
        updateBadgeText();
    }
    if (changes.testerenabled) {
        testerEnabled = changes.testerenabled.newValue;
        updateBadgeText();
    }
});

function arrayUnique(array) {
    var a = array;
    for (var i = 0; i < a.length; i++) {
        for (var j = i+1; j < a.length; j++) {
            if (a[i].split('-')[2] === a[j].split('-')[2] && a[i].split('-')[3] === a[j].split('-')[3]) {
                a.splice(j--, 1);
            }
        }
    }
    return a;
}

function resetResponds() {
    chrome.storage.local.set({responds: arrayUnique(responds)}, function(a){
        updateBadgeText();
    });
}

//tab actions
function getTab(tid) { if (!Tabs["Tab"+tid]) Tabs["Tab"+tid] = {Id:tid,Url:""}; return Tabs["Tab"+tid]; }
function setTab(tid,data) { Tabs["Tab"+tid] = data; }
function removeTab(tid) { if (Tabs["Tab"+tid]) delete Tabs["Tab"+tid]; }

chrome.tabs.onActivated.addListener(tabActivated);
chrome.tabs.onUpdated.addListener(tabUpdated);
chrome.tabs.onRemoved.addListener(tabRemoved);

function tabActivated() {
    updateCurrentTab();
}
function tabRemoved(tabId) {
    removeTab(tabId);
    updateCurrentTab();
}
function tabUpdated(tabId,info,tab) {
    var t = getTab(tabId);
    t.Url = tab.url+"";
    setTab(t.Id,t);
    updateCurrentTab();
    resetResponds();
    updateBadgeText();
}
function updateCurrentTab() {
    chrome.tabs.query({ active:true, currentWindow:true }, function(tabs) {
        var tab = tabs[0];
        if (!tab) return;
        CurTab.Id = tab.id || 0;
        CurTab.Url = tab.url || "";
        updateBadgeText();
    });
}
function updateBadgeText() {
    var num = 0;
    var t = getTab(CurTab.Id);
    for (var i = 0; i < responds.length; i++) {
        var tid = responds[i].split('-')[0];
        var status = responds[i].split('-')[1];
        if (tid == t.Id && status === "true") num++;
    }
    chrome.browserAction.setBadgeText({"text":((num === 0 || !testerEnabled) ? "" : (num > 10 ? "10+" : num+""))});
}


// Inject mode
chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(request) {
        if (request.msg && request.msg.cmd === "injectBN") {
            chrome.tabs.executeScript(port.sender.tab.id, {
                code: "var rnd = Math.floor(Math.random()*1000000); var fif = '<iframe id=\"injected-fif-'+ rnd +'\" src=\"javascript:\\'\\'\" width=\"100%\" height=\"100%\" frameborder=\"0\" scrolling=\"no\" marginwidth=\"0\" marginheight=\"0\"><\/iframe>'; try { var placement = document.querySelector('"+ (request.msg.auto ? '[dsptag-id="'+ request.msg.auto +'"]' : request.msg.manual.replace(/\\\./g,'\\\\.')) +"'); if (placement) { if ('"+ request.msg.insertion +"' === 'overwrite') { placement.innerHTML = ''; } placement.insertAdjacentHTML('"+ (request.msg.insertion === 'overwrite' ? 'afterbegin' : request.msg.insertion) +"', fif); var win = document.getElementById('injected-fif-'+ rnd).contentWindow; var doc = win.document; doc.open(); doc.write('<html><head><scr'+'ipt> inFIF=true; (_adform = []).push([\"responsive\", true]);<\/scr'+'ipt><style>body,html{height:100%}<\/style><\/head><body><script src=\"https://track.adform.net/adfscript/?bn="+ request.msg.tagId + "\"><\/script><script>"+ (request.msg.hide ? "frameElement.style.display = \"none\";" : "") + "<\/script></body></html>'); doc.close(); } else { alert('Placement was not found'); } } catch(ex) { if (ex.toString().indexOf(\'Cannot read property \\'contentWindow\\' of null\') > -1) { alert(\'Select another element than Iframe\'); } else { alert(ex); } }"
            });
        }
        if (request.msg && request.msg.cmd === "injectMID") {
            chrome.tabs.executeScript(port.sender.tab.id, {
                code: "var rnd = Math.floor(Math.random()*1000000); var fif = '<iframe id=\"injected-fif-'+ rnd +'\" src=\"javascript:\\'\\'\" width=\"100%\" height=\"100%\" frameborder=\"0\" scrolling=\"no\" marginwidth=\"0\" marginheight=\"0\"><\/iframe>'; try { var placement = document.querySelector('"+ (request.msg.auto ? '[dsptag-id="'+ request.msg.auto +'"]' : request.msg.manual.replace(/\\\./g,'\\\\.')) +"'); if (placement) { if ('"+ request.msg.insertion +"' === 'overwrite') { placement.innerHTML = ''; } placement.insertAdjacentHTML('"+ (request.msg.insertion === 'overwrite' ? 'afterbegin' : request.msg.insertion) +"', fif); var win = document.getElementById('injected-fif-'+ rnd).contentWindow; var doc = win.document; doc.open(); doc.write('<html><head><scr'+'ipt> inFIF=true; (_adform = []).push([\"responsive\", true]);<\/scr'+'ipt><style>body,html{height:100%}<\/style><\/head><body><script data-adfscript=\"adx.adform.net/adx/?mid="+ request.msg.tagId +"\"><\/script><script async src=\"https://s1.adform.net/banners/scripts/adx.js\"><\/script><script>"+ (request.msg.hide ? "frameElement.style.display = \"none\";" : "") + "<\/script></body></html>'); doc.close(); } else { alert('Placement was not found'); } } catch(ex) { if (ex.toString().indexOf(\'Cannot read property \\'contentWindow\\' of null\') > -1) { alert(\'Select another element than Iframe\'); } else { alert(ex); } }"
            });
        }
    });
});