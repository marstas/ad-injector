chrome.runtime.onMessage.addListener(processMessage);

function processMessage(msg, sender, sendResponse){
    if (msg.cmd === 'getPlacements') {        
        chrome.storage.local.get(['sizelist'], function(result) {
            var response = getAdPlacements(result.sizelist);
            sendResponse(response);
        });
    }
    if (msg.cmd === 'highlightPlacement') {
        var highlightTarget;

        if (msg.automatic === null) {
            highlightTarget = document.querySelector(msg.manual);
        } else {
            highlightTarget = document.querySelector('[dsptag-id="'+ msg.automatic +'"]');
        }

        if (highlightTarget) {
            highlightTarget.removeAttribute('dsptag-highlight');
            setTimeout(function() { highlightTarget.setAttribute('dsptag-highlight',''); }, 0);
            if (!checkVisible(highlightTarget)) {
                highlightTarget.scrollIntoView({behavior: "smooth", block: "start"});
            }
        }
    }
    if (msg.cmd === 'injectBN') {
        var port = chrome.extension.connect({ name: "injectBN" });
        port.postMessage({msg: msg});
    }
    if (msg.cmd === 'injectMID') {
        var port = chrome.extension.connect({ name: "injectMID" });
        port.postMessage({msg: msg});
    }
    return true;
}

function checkVisible(el) {
    var rect = el.getBoundingClientRect();
    var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}


function getAdPlacements(sizes) {
    var adPlacements = [], adPlacementId = 0;

    var markedElements = document.querySelectorAll('[dsptag-id]');
    for (var i = 0; i < markedElements.length; i++) {
        markedElements[i].removeAttribute('dsptag-id');
    }

    function getQuerySelector(elem) {
        var element = elem, str = "";
        function loop(element) {
            if (element.getAttribute("id")) { str = "#" + element.getAttribute("id"); return str; }
            if (document.body === element) { str = "body"; return str; }
            if (element.getAttribute("class")) { str = "." + element.getAttribute("class").replace(/\s/g, "."); return str; }
            str = element.nodeName.toLowerCase();
        }
        loop(element);
        return str;
    }

    function getAdPlacementById(id) {
        for (var i = 0, l = adPlacements.length; i < l; i++) {
            if (adPlacements[i].id == id) return adPlacements[i];
        }
        return {};
    }

    function deleteAdPlacement(id) {
        var a = [];
        for (var i = 0, l = adPlacements.length; i < l; i++) {
            if (adPlacements[i].id != id) a.push(adPlacements[i]);
        }
        adPlacements = a;
    }

    for (var b = ["script","iframe"], bi = 0, bl = b.length; bi < bl; bi++) {
        els = document.getElementsByTagName(b[bi]);
        for (var i = 0, l = els.length; i < l; i++) {
            var el = els[i];
            if (!el.parentNode || el.parentNode.nodeName.toLowerCase().match(/head|body/)) continue;
            var dspTagId = el.parentNode.getAttribute("dsptag-id");
            pl = dspTagId ? getAdPlacementById(dspTagId) : {};
            pl.tagType = b[bi];
            if (pl.tagType == "iframe") {
                pl.placementSize = el.offsetWidth +"x"+ el.offsetHeight;
                if (pl.placementSize == "0x0" /*|| pl.placementSize == "1x1"*/) {
                    if (pl.id) deleteAdPlacement(pl.id);
                    continue;
                }
            } else {
                pl.placementSize = el.parentNode.offsetWidth +"x"+ el.parentNode.offsetHeight;
            }

            if (!pl.id && sizes.length) {
                if (sizes.indexOf(pl.placementSize) > -1) {
                    adPlacementId++;
                    pl.id = adPlacementId;
                    pl.placementQuerySelector = getQuerySelector(el.parentNode);
                    el.parentNode.setAttribute("dsptag-id", adPlacementId);
                    adPlacements.push(pl);
                }
            }
        }
    }

    return adPlacements;
}