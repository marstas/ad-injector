chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    processMessage(request, sender);
    sendResponse(true);
});

function processMessage(request, sender) {
    if (request.msg && request.msg.cmd === "inject") {
        //https://stackoverflow.com/questions/5989315/regex-for-match-replacing-javascript-comments-both-multiline-and-inline
        var escapedTagHtml = request.msg.taghtml
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // remove JS comments
            .replace(/<!--[\s\S]*?-->/gm, '') // remove HTML comments
            .replace(/\r?\n|\r/g, '') // remove new lines
            .replace(/\\\"/g, '\\\\"') // double-escape already escaped double-quotes
        chrome.tabs.executeScript(sender.tab.id, {
            code: "var rnd = Math.floor(Math.random()*1000000); var fif = '<iframe id=\"injected-fif-'+ rnd +'\" src=\"javascript:\\'\\'\" width=\"100%\" height=\"100%\" frameborder=\"0\" scrolling=\"no\" marginwidth=\"0\" marginheight=\"0\"><\/iframe>'; try { var placement = document.querySelector('" + (request.msg.auto ? '[dsptag-id="' + request.msg.auto + '"]' : request.msg.manual.replace(/\\\./g, '\\\\.')) + "'); if (placement) { if ('" + request.msg.insertion + "' === 'overwrite') { placement.innerHTML = ''; } placement.insertAdjacentHTML('" + (request.msg.insertion === 'overwrite' ? 'afterbegin' : request.msg.insertion) + "', fif); var win = document.getElementById('injected-fif-'+ rnd).contentWindow; var doc = win.document; doc.open(); doc.write('<html><head><scr'+'ipt> inFIF=true; (_adform = []).push([\"responsive\", true]);<\/scr'+'ipt><style>body,html{height:100%}<\/style><\/head><body>" + escapedTagHtml + "<script>" + (request.msg.hide ? "frameElement.style.display = \"none\";" : "") + "<\/script></body></html>'); doc.close(); } else { alert('Placement was not found'); } } catch(ex) { if (ex.toString().indexOf(\'Cannot read property \\'contentWindow\\' of null\') > -1) { alert(\'Select another element than Iframe\'); } else { alert(ex); } }"
        });
    }

    return true;
}