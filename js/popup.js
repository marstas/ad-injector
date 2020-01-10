window.addEventListener('load', init);

function init() {
    //wrappers
    var injectWrapper = document.getElementById('inject-wrapper'),
        respondWrapper = document.getElementById('respond-wrapper');
    //buttons
    var btnInject = document.getElementById('inject'),
        btnRespond = document.getElementById('respond'),
        btnOnOff = document.getElementById('on-off'),
        btnReload = document.getElementById('reload'),
        btnGo = document.getElementById('btn-go'),
        btnSet = document.getElementById('btn-set'),
        btnSizes = document.getElementById('sizes'),
        btnAddSize = document.getElementById('add-size'),
        btnRemoveSizes = document.getElementById('remove-sizes'),
        btnDefaultSizes = document.getElementById('default-sizes'),
        btnRefreshTable = document.getElementById('refresh-table');
    //inputs
    var radioBn = document.getElementById('radio-bn'),
        radioMid = document.getElementById('radio-mid'),
        inputTag = document.getElementById('bn-mid'),
        checkboxHideIframe = document.getElementById('checkbox-hide-iframe'),
        inputQs = document.getElementById('input-qs'),
        inputSize = document.getElementById('input-size'),
        inputStringToMatch = document.getElementById('string-to-match'),
        inputUrlToFile = document.getElementById('url-to-file'),
        inputLocalFile = document.getElementById('local-file'); //inactive
    //other
    var quickies = document.getElementById('quickies'),
        infoMessageInject = document.getElementById('info-message-inject'),
        infoMessageRespond = document.getElementById('info-message-respond'),        
        sizeList = document.getElementById('size-list'),
        placements = document.getElementById('placements'),
        manualSelector = document.getElementById('manual-selector'),
        manualInjectType = manualSelector.getElementsByTagName('select')[0],
        respondRules = document.getElementById('respond-rules'),
        sizes = [], respondEntries = [], refreshInterval;

    // Button handlers
    btnInject.onclick = function(event) { toggleMode('click', event) };
    btnRespond.onclick = function(event) { toggleMode('click', event) };
    btnOnOff.onclick = function() { toggleOnOff('click'); }
    btnReload.onclick = function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            setInfoMessage();
            chrome.tabs.reload(tabs[0].id, {bypassCache: true});
            if (!refreshInterval) {
                var times = 10;
                refreshInterval = setInterval(function(){
                    if (!times--) clearInterval(refreshInterval);
                    refreshPopup();
                },1000);
            }
        });
    }
    
    inputTag.onkeyup = function(event) { handleEnter(event,btnGo); }
    inputSize.onkeyup = function(event) { handleEnter(event,btnAddSize); }
    inputQs.onkeyup = function(event) { handleEnter(event,btnGo); }

    btnGo.onclick = handleGo;
    btnRefreshTable.onclick = refreshPopup;

    btnSizes.onclick = function() {
        setInfoMessage();
        if (btnSizes.innerHTML === 'Show placement sizes') {
            btnSizes.innerHTML = 'Hide placement sizes';
            sizeList.className = '';
            getSizeList();
        } else {
            btnSizes.innerHTML = 'Show placement sizes';
            sizeList.className = 'hidden';
        }
    }
    btnAddSize.onclick = function() {
        var newSize = inputSize.value && inputSize.value.replace(/\s/g,'');
        if (newSize.length && newSize.indexOf('x') > -1 && newSize.split('x')[1]) {
            if (!sizes.length) sizes = [];
            if (sizes.indexOf(newSize) < 0) sizes.push(newSize);
            chrome.storage.local.set({sizelist: sizes}, function(a){});
            getSizeList();
            inputSize.value = '';
            setInfoMessage();
        } else {
            setInfoMessage('inject','incorrect size','warning');
        }
    }
    btnRemoveSizes.onclick = function() {
        chrome.storage.local.set({sizelist: true}, function(a){});
        getSizeList();
        setInfoMessage();
        inputSize.value = '';
    }
    btnDefaultSizes.onclick = function() {
        chrome.storage.local.set({sizelist: false}, function(a){});
        getSizeList();
        setInfoMessage();
        inputSize.value = '';
    }

    function handleEnter(event,btn) {
        event.preventDefault();
        if (event.keyCode === 13) btn.click();
    }

    // mode/popup control
    toggleMode('init');
    toggleOnOff('init');

    function toggleOnOff(action) {
        chrome.storage.local.get(['testerenabled'], function(result) {
            if (result.testerenabled === true || result.testerenabled === undefined) {
                action === 'click' ? btnOnOff.value = 'off' : btnOnOff.value = 'on';
                chrome.storage.local.set({testerenabled: (action === 'click' ? false : true)}, function(){});
            } else {
                action === 'click' ? btnOnOff.value = 'on' : btnOnOff.value = 'off';
                chrome.storage.local.set({testerenabled: (action === 'click' ? true : false)}, function(){});
            }
        });
    }

    function toggleMode(action, event) {
        chrome.storage.local.get(['testermode'], function(result) {
            var mode = result.testermode;
            if (mode === 'inject' || mode === undefined) {
                action === 'click' ? (event.target == btnInject ? injectOrRespond('inject') : injectOrRespond('respond')) : injectOrRespond('inject');
                chrome.storage.local.set({testermode: (action === 'click' ? (event.target == btnInject ? 'inject' : 'respond') : 'inject')}, function(){});
            } else {
                action === 'click' ? (event.target == btnRespond ? injectOrRespond('respond') : injectOrRespond('inject')) : injectOrRespond('respond');
                chrome.storage.local.set({testermode: (action === 'click' ? (event.target == btnRespond ? 'respond' : 'inject') : 'respond')}, function(){});
            }
        });
        function injectOrRespond(param) {
            if (param === 'inject') {
                btnInject.setAttribute('selected','');
                btnRespond.removeAttribute('selected');
            } else {
                btnRespond.setAttribute('selected','');
                btnInject.removeAttribute('selected');
            }
        }
    }

    // Inject mode
    radioBn.onchange = toggleRadios;
    radioMid.onchange = toggleRadios;
    checkboxHideIframe.onchange = toggleRadios;

    for (var q = quickies.getElementsByTagName('a'), l = q.length, i = 0; i < l; i++) {
        q[i].onclick = function() {
            if (radioBn.checked && inputTag.value.length) {
                inputTag.value = inputTag.value.split(';')[0] + ';' + this.innerHTML;
                inputTag.dispatchEvent(new Event('change'));
            }
        }
    }

    //restore the radio button selection
    chrome.storage.local.get(['radiobn'], function(result) { 
        if (result.radiobn) {
            radioBn.checked = true;
            radioMid.checked = false;
        } else {
            radioBn.checked = false;
            radioMid.checked = true;
        }
        toggleRadios();
    });
    chrome.storage.local.get(['checkboxhideiframe'], function(result) { 
        if (result.checkboxhideiframe) {
            checkboxHideIframe.checked = true;
        } else {
            checkboxHideIframe.checked = false;
        }
        toggleRadios();
    });

    function toggleRadios() {
        if (radioBn.checked) {
            inputTag.placeholder = "insert BN";
            quickies.className = "";
            chrome.storage.local.set({radiobn: true}, function(a){});
        } else {
            inputTag.placeholder = "insert MID";
            quickies.className = "hidden";
            chrome.storage.local.set({radiobn: false}, function(a){});
        }
        if (checkboxHideIframe.checked) {
            chrome.storage.local.set({checkboxhideiframe: true}, function(a){});
        } else {
            chrome.storage.local.set({checkboxhideiframe: false}, function(a){});            
        }
        chrome.storage.local.get(['tagid'], function(result) { 
            if (result.tagid) inputTag.value = result.tagid; 
            else inputTag.value = "";
        });
    }

    //fill in placements table
    function listPlacements() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {cmd: 'getPlacements'}, function(response) {
                if (response) {
                    var html = '<table><thead><tr><th>#<\/th><th>Size<\/th><th>Placement<\/th><\/tr><\/thead><tbody>';
                    for (var el in response) {
                        html += '<tr class="row"><td>'+ response[el].id +'<\/td><td>'+ response[el].placementSize +'<\/td><td><a title="'+ response[el].placementQuerySelector +'">'+ response[el].placementQuerySelector +'<\/a><\/td><\/tr>'; 
                    }
                    html += '<tr id="manual"><td colspan="3" style="text-align:center;">Manual Selector<\/td><\/tr><\/tbody><\/table>';
                    placements.innerHTML = html;

                    var placementRows = document.getElementsByClassName('row');
                    var manualInputRow = document.getElementById('manual');

                    manualInputRow.addEventListener('click', function() {
                        clearInterval(refreshInterval);
                        manualSelector.classList.remove('hidden');
                        for (var i = 0; i < placementRows.length; i++) {
                            placementRows[i].removeAttribute('selected');
                        }
                        this.setAttribute('selected','');
                        if (inputQs.value.length) {
                            highlightPlacement(null, inputQs.value.replace(/\//g,'\\/'));
                        }
                    });

                    response.forEach(function(elem) {
                        try {
                            placementRows[elem.id-1].addEventListener('click', function() {
                                clearInterval(refreshInterval);
                                manualInputRow.removeAttribute('selected');
                                manualSelector.classList.add('hidden');
                                for (var i = 0; i < placementRows.length; i++) {
                                    placementRows[i].removeAttribute('selected');
                                }
                                this.setAttribute('selected','');
                                highlightPlacement(elem.id);
                            });
                        } catch(ex) {}
                    });
                    getSizeList();
                }
            });
        });
    }

    function highlightPlacement(automatic, manual) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) { 
            clearInterval(refreshInterval);
            chrome.tabs.sendMessage(tabs[0].id, {cmd: 'highlightPlacement', automatic: automatic, manual: manual}, function(response) {});
        });
    }

    //restore the on/off, mode selections
    function refreshPopup() {
        chrome.storage.local.get(['testerenabled'], function(result) {
            if (result.testerenabled) {
                chrome.browserAction.setIcon({path:'img/green16.png'});
                chrome.storage.local.get(['testermode'], function(result) {
                    if (result.testermode === 'inject') {
                        respondWrapper.className = 'hidden';
                        injectWrapper.className = '';
                        listPlacements();
                    } else if (result.testermode === 'respond') {
                        respondWrapper.className = '';
                        injectWrapper.className = 'hidden';
                    }
                });
            } else {
                chrome.browserAction.setIcon({path:'img/red16.png'});
                respondWrapper.className = 'hidden';
                injectWrapper.className = 'hidden';
            }
        });
    }
    refreshPopup();

    chrome.storage.onChanged.addListener(function(changes,namespace) {
        if (changes.testerenabled || changes.testermode || changes.sizelist) refreshPopup();
        if (changes.respondentries && changes.respondentries.newValue) {
            if (changes.respondentries.newValue.length) respondRules.className = '';
            else respondRules.className = 'hidden';
        }
    });
    
    function setInfoMessage(mode,msg,type) {
        var _mode, _msg, _type;
        if (!arguments.length) { _mode = ''; _msg = ''; _type = '';} 
        else { _mode = mode; _msg = msg; _type = type; }

        if (_mode === 'inject') {
            infoMessageInject.innerHTML = _msg;
            infoMessageInject.className = _type;
        } else if (_mode === 'respond') {
            infoMessageRespond.innerHTML = _msg;
            infoMessageRespond.className = _type;
        } else {
            infoMessageInject.innerHTML = _msg;
            infoMessageInject.className = _type;
            infoMessageRespond.innerHTML = _msg;
            infoMessageRespond.className = _type;
        }
    }

    function getSizeList() {
        chrome.storage.local.get(['sizelist'], function(result) {
            if (result.sizelist) {
                sizes = result.sizelist;
            } else {
                sizes = ["300x250","320x50","300x50","320x320","320x100","336x280","300x300","468x60","300x600","160x600","120x600","120x240","180x150","200x200","250x250","234x60","240x400","300x1050","728x90",'970x250','970x90',"930x180"];
                chrome.storage.local.set({sizelist: sizes}, function(a){});
            }

            var spans = sizeList.getElementsByTagName('span');
            while (spans[0]) spans[0].parentNode.removeChild(spans[0]);

            var rows = document.getElementsByClassName('row');
            var sizesInTable = [];
            for (var i = 0; i < rows.length; i++) { sizesInTable.push(rows[i].childNodes[1].innerHTML); }

            for (var size in sizes) {
                var sz = document.createElement('span');
                sz.className = sizesInTable.indexOf(sizes[size]) > -1 ? 'matched' : '';
                sz.innerHTML = '&nbsp;'+ sizes[size] +'<span class="close">&nbsp;&times;&nbsp;</span>';
                sz.onclick = function() {
                    this.parentElement.removeChild(this);
                    var index = sizes.indexOf(this.textContent.trim().split(/\s/)[0]);
                    if (index > -1) {
                        sizes.splice(index, 1);
                        chrome.storage.local.set({sizelist: sizes}, function(a){});
                    }
                }
                sizeList.appendChild(sz);
            }
        });
    }
    getSizeList();

    function handleGo() {
        if (!inputTag.value.length) { setInfoMessage('inject','insert tag ID','warning'); return; }
        if (!document.getElementById('manual')) { setInfoMessage('inject','refresh the page','warning'); return; }

        var tagId = inputTag.value;
        var autoPlacementSelected = Array.from(document.getElementsByClassName('row')).find(function(element) { return element.hasAttribute('selected'); });
        var selectedPlacementId = autoPlacementSelected ? autoPlacementSelected.firstChild.innerHTML : false;
        var manualPlacementSelector = document.getElementById('manual').hasAttribute('selected') ? (inputQs.value.length ? inputQs.value.replace(/\//g,'\\\\/') : false) : false;
        var insertionSelected = manualSelector.getElementsByTagName('select')[0];
        var insertionType = manualPlacementSelector ? insertionSelected.options[insertionSelected.selectedIndex].value : 'overwrite';
        var hideIframe = document.getElementById('checkbox-hide-iframe').checked;

        if (selectedPlacementId || manualPlacementSelector) {
            setInfoMessage();
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {cmd: radioBn.checked ? 'injectBN' : 'injectMID', tagId: tagId.trim(), auto: selectedPlacementId, manual: manualPlacementSelector, insertion: insertionType, hide: hideIframe}, function(response) {});
            });
        } else {
            setInfoMessage('inject','insert selector or select the placement', 'warning');
        }
    }


    // Respond mode
    btnSet.onclick = handleSet;
    inputUrlToFile.onchange = toggleDisabled;
    inputLocalFile.onchange = toggleDisabled;

    function listRespondEntries() {
        chrome.storage.local.get(['respondentries'], function(result) {
            respondRules.getElementsByTagName('tbody')[0].innerHTML = '';
            if (result.respondentries && result.respondentries.length) {
                respondRules.className = '';
                for (var i = 0; i < result.respondentries.length; i++) {
                    var newRow = respondRules.getElementsByTagName('tbody')[0].insertRow(0);
                    newRow.title = 'remove rule';
                    var cell1 = newRow.insertCell(0);
                    var cell2 = newRow.insertCell(1);
                    cell1.innerHTML = result.respondentries[i].stringToMatch;
                    cell2.innerHTML = result.respondentries[i].replacementJS;
                }
            } else {
                respondRules.className = 'hidden';
            }
            closeOnClick();
        });
    }
    listRespondEntries();

    function handleSet() {
        var stringToMatch = inputStringToMatch.value;
        var urlToFile = inputUrlToFile.value;
        // todo
        var localFile = inputLocalFile.value && inputLocalFile.files[0];
        // /todo
        // var replacementJS = urlToFile ? urlToFile : localFile.name;
        var replacementJS = (urlToFile && urlToFile.match(/^\d{4,}/)) ? ("https://track.adform.net/adfscript/?bn="+ urlToFile) : urlToFile;
        var tbody = respondRules.getElementsByTagName('tbody')[0];
        var rows = tbody.rows;

        var regx = new RegExp(stringToMatch);
        var unsafeMatch = urlToFile.match(regx) ? true : false;

        if (!stringToMatch.length || (!urlToFile.length && !localFile)) {
            setInfoMessage('respond','some field is empty','warning');
            return;
        }
        if (rows.length > 4) {
            setInfoMessage('respond','up to 5 rules are allowed','warning');
            return;
        }
        if (unsafeMatch) {
            setInfoMessage('respond','matching string can not match the URL','warning');
            return;
        }
        setInfoMessage();

        if (!rowExists(rows,stringToMatch,replacementJS)) {
            var newRow = tbody.insertRow(0);
            newRow.title = 'remove rule';
            var cell1 = newRow.insertCell(0);
            var cell2 = newRow.insertCell(1);
            cell1.innerHTML = stringToMatch;
            cell2.innerHTML = replacementJS;
            
            respondEntries.push({ stringToMatch: stringToMatch, replacementJS: replacementJS });

            chrome.storage.local.get(['respondentries'], function(result) {
                var newEntries = result.respondentries ? arrayUnique(result.respondentries.concat(respondEntries)): respondEntries;
                chrome.storage.local.set({respondentries: newEntries}, function(a){
                    closeOnClick();
                });
            });
        }
    }

    function rowExists(rows,c1,c2) {
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].cells[0].innerHTML == c1 && rows[i].cells[1].innerHTML == c2) return true;
        }
        return false;
    }

    function arrayUnique(array) {
        var a = array.concat();
        for (var i = 0; i < a.length; i++) {
            for (var j = i+1; j < a.length; j++) {
                if (a[i].stringToMatch === a[j].stringToMatch && a[i].replacementJS === a[j].replacementJS) {
                    a.splice(j--, 1);
                }
            }
        }
        return a;
    }

    function closeOnClick() {
        var rows = respondRules.getElementsByTagName('tbody')[0].rows;
        for (var i = 0; i < rows.length; i++) {
            rows[i].onclick = function() {
                var _this = this;
                chrome.storage.local.get(['respondentries'], function(result) {
                    var substracted = [];
                    var m = _this.cells[0].innerHTML;
                    var r = _this.cells[1].innerHTML;

                    _this.parentNode.removeChild(_this);
                    inputStringToMatch.value = m;
                    inputUrlToFile.value = r;
                    inputLocalFile.value = '';
                    inputLocalFile.disabled = true;
                    inputUrlToFile.disabled = false;

                    for (var i = 0; i < result.respondentries.length; i++) {
                        if (result.respondentries[i].stringToMatch === m && result.respondentries[i].replacementJS === r) {
                            continue;
                        } else {
                            substracted.push(result.respondentries[i]);
                        }
                    }
                    chrome.storage.local.set({respondentries: substracted}, function(a){});
                });
            }
        }
    }
    
    function toggleDisabled(evt) {
        if (evt.target == inputUrlToFile) {
            if (inputUrlToFile.value.length) {
                inputLocalFile.disabled = true;
            } else {
                inputLocalFile.disabled = false;
            }
        } else if (evt.target == inputLocalFile) {
            if (inputLocalFile.value.length) {
                inputUrlToFile.disabled = true;
            } else {
                inputUrlToFile.disabled = false;
            }
        }
    }

    //reinsert inputs
    inputTag.onchange = function(event) { inputChanged(event); }
    inputQs.onchange = function(event) { inputChanged(event); }
    inputStringToMatch.onchange = function(event) { inputChanged(event); }
    inputUrlToFile.onchange = function(event) { inputChanged(event); }
    manualInjectType.onchange = function(event) { inputChanged(event); }

    chrome.storage.local.get(['tagid'], function(result) { if (result.tagid) inputTag.value = result.tagid; });
    chrome.storage.local.get(['qs'], function(result) { if (result.qs) inputQs.value = result.qs; });
    chrome.storage.local.get(['stringtomatch'], function(result) { if (result.stringtomatch) inputStringToMatch.value = result.stringtomatch; });
    chrome.storage.local.get(['urltofile'], function(result) { if (result.urltofile) inputUrlToFile.value = result.urltofile; });
    chrome.storage.local.get(['manualinjecttype'], function(result) { if (result.manualinjecttype) manualInjectType.value = result.manualinjecttype; });

    function inputChanged(evt) {
        if (evt.target == inputTag) chrome.storage.local.set({tagid: inputTag.value}, function(a){});
        if (evt.target == inputQs) chrome.storage.local.set({qs: inputQs.value}, function(a){});
        if (evt.target == inputStringToMatch) chrome.storage.local.set({stringtomatch: inputStringToMatch.value}, function(a){});
        if (evt.target == inputUrlToFile) chrome.storage.local.set({urltofile: inputUrlToFile.value}, function(a){});
        if (evt.target == manualInjectType) chrome.storage.local.set({manualinjecttype: manualInjectType.value}, function(a){});
    }

    //set respond rule color
    chrome.storage.local.get(['responds'], function(result) { 
        if (result.responds) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var rows = Array.from(respondRules.getElementsByTagName('tbody')[0].rows).reverse();
                for (var i = 0; i < result.responds.length; i++) {
                    var tabId = result.responds[i].split('-')[0];
                    var success = result.responds[i].split('-')[1];
                    var stm = result.responds[i].split('-')[2];
                    var rjs = result.responds[i].split('-')[3];

                    for (var j = 0; j < rows.length; j++) {
                        var num;
                        if (rows[j].cells[0].innerHTML === stm && rows[j].cells[1].innerHTML === rjs) {
                            num = j;
                            if (tabs[0].id == tabId) {
                                if (success === 'true') rows[num].style.backgroundColor = 'lightgreen';
                                if (success === 'false') rows[num].style.backgroundColor = 'orange';
                            }
                        }
                    }
                }
            });
        }
    });

    chrome.runtime.onMessage.addListener(setRuleColor);

    function setRuleColor(msg,sender,sendResponse) {
        if (msg.type === "respondRuleStatus") {
            var rows = Array.from(respondRules.getElementsByTagName('tbody')[0].rows).reverse();
            if (msg.success === true && rows[msg.ruleId]) {
                rows[msg.ruleId].style.backgroundColor = 'lightgreen';
            } else if (msg.success === false && rows[msg.ruleId]) {
                rows[msg.ruleId].style.backgroundColor = 'orange';
            }
        }
    }

}