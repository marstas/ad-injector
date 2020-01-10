window.addEventListener('load', init);

function init() {
    //buttons
    var btnReload = document.getElementById('reload'),
        btnInject = document.getElementById('btn-inject'),
        btnSizes = document.getElementById('sizes'),
        btnAddSize = document.getElementById('add-size'),
        btnRemoveSizes = document.getElementById('remove-sizes'),
        btnDefaultSizes = document.getElementById('default-sizes'),
        btnRefreshTable = document.getElementById('refresh-table');
    //inputs
    var inputTag = document.getElementById('tag-html'),
        checkboxHideIframe = document.getElementById('checkbox-hide-iframe'),
        inputQs = document.getElementById('input-qs'),
        inputSize = document.getElementById('input-size');
    //other
    var quickies = document.getElementById('quickies'),
        infoMessageInject = document.getElementById('info-message-inject'),
        sizeList = document.getElementById('size-list'),
        placements = document.getElementById('placements'),
        manualSelector = document.getElementById('manual-selector'),
        manualInjectType = manualSelector.getElementsByTagName('select')[0],
        sizes = [],
        refreshInterval,
        placementsTableContent;

    // button handlers
    btnReload.onclick = function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            setInfoMessage();
            chrome.tabs.reload(tabs[0].id, { bypassCache: true });
            init();
        });
    }

    inputSize.onkeyup = function (event) { handleEnter(event, btnAddSize); }
    inputQs.onkeyup = function (event) { handleEnter(event, btnInject); }

    btnInject.onclick = handleInject;
    btnRefreshTable.onclick = listPlacements;

    btnSizes.onclick = function () {
        setInfoMessage();
        if (btnSizes.innerHTML === 'Placement size list') {
            btnSizes.innerHTML = 'Collapse';
            sizeList.className = '';
            getSizeList();
        } else {
            btnSizes.innerHTML = 'Placement size list';
            sizeList.className = 'hidden';
        }
    }

    btnAddSize.onclick = function () {
        var newSize = inputSize.value && inputSize.value.replace(/\s/g, '');
        if (newSize.length && newSize.indexOf('x') > -1 && newSize.split('x')[1]) {
            if (!sizes.length) sizes = [];
            if (sizes.indexOf(newSize) < 0) sizes.push(newSize);
            chrome.storage.local.set({ sizelist: sizes }, function (a) {});
            getSizeList();
            inputSize.value = '';
            setInfoMessage();
        } else {
            setInfoMessage('inject', 'incorrect size', 'warning');
        }
    }

    btnRemoveSizes.onclick = function () {
        chrome.storage.local.set({ sizelist: true }, function (a) {});
        getSizeList();
        setInfoMessage();
        inputSize.value = '';
    }

    btnDefaultSizes.onclick = function () {
        chrome.storage.local.set({ sizelist: false }, function (a) {});
        getSizeList();
        setInfoMessage();
        inputSize.value = '';
    }

    function handleEnter(event, btn) {
        event.preventDefault();
        if (event.keyCode === 13) btn.click();
    }

    checkboxHideIframe.onchange = toggleRadios;

    // use predefined tag templates
    for (var q = quickies.getElementsByTagName('a'), l = q.length, i = 0; i < l; i++) {
        q[i].onclick = function () {
            if (this.innerHTML === "BN-Javascript") {
                inputTag.value = '<script>\xa0//replace BN value\n\xa0\xa0var bn = "xxxxxxx;compoundSeqNo=1";\n\xa0\xa0document.write("<script src=\\"https://track.adform.net/adfscript/?bn="+ bn +"\\"><\/scr"+"ipt>");\n</scr'+'ipt>';
                inputTag.dispatchEvent(new Event('change'));
            }
            if (this.innerHTML === "BN-Iframe") {
                inputTag.value = '<script>\xa0//replace BN value\n\xa0\xa0var bn = "xxxxxxx;compoundSeqNo=1";\n\xa0\xa0document.write("<iframe name=\\"CPbanner"+ bn +"\\" src=\\"https://track.adform.net/adfscript/?bn="+ bn +";cpjs=2\\" width=\\"100%\\" height=\\"100%\\" marginwidth=0 marginheight=0 hspace=0 vspace=0 frameborder=0 scrolling=no><\/iframe>");\n</scr'+'ipt>';
                inputTag.dispatchEvent(new Event('change'));
            }
            if (this.innerHTML === "MID-Sync") {
                inputTag.value = '<script>\xa0//replace MID value\n\xa0\xa0var mid = "xxxxx";\n\xa0\xa0document.write("<script src=\\"https://adx.adform.net/adx/?mid="+ mid +"\\"><\/scr"+"ipt>");\n</scr'+'ipt>';
                inputTag.dispatchEvent(new Event('change'));
            }
            if (this.innerHTML === "MID-Async") {
                inputTag.value = '<script>\xa0//replace MID value\n\xa0\xa0var mid = "xxxxx";\n\xa0\xa0document.write("<script data-adfscript=\\"adx.adform.net/adx/?mid="+ mid +"\\"><\/scr"+"ipt><script src=\\"https://s1.adform.net/banners/scripts/adx.js\\"><\/scr"+"ipt>");\n</scr'+'ipt>';
                inputTag.dispatchEvent(new Event('change'));
            }
        }
    }

    // restore the checkbox selection
    chrome.storage.local.get(['checkboxhideiframe'], function (result) {
        if (result.checkboxhideiframe) {
            checkboxHideIframe.checked = true;
        } else {
            checkboxHideIframe.checked = false;
        }
        toggleRadios();
    });

    function toggleRadios() {        
        if (checkboxHideIframe.checked) {
            chrome.storage.local.set({
                checkboxhideiframe: true
            }, function (a) {});
        } else {
            chrome.storage.local.set({
                checkboxhideiframe: false
            }, function (a) {});
        }

        chrome.storage.local.get(['taghtml'], function (result) {
            if (result.taghtml) inputTag.value = result.taghtml;
            else inputTag.value = "";
        });
    }

    // fill-in the placements table
    function listPlacements() {        
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { cmd: 'getPlacements' }, function (response) {
                ignoreError(response);
                if (response) {
                    var html = '<table><thead><tr><th>#<\/th><th>Size<\/th><th>Placement<\/th><\/tr><\/thead><tbody>';

                    for (var el in response) {
                        html += '<tr class="row"><td>' + response[el].id + '<\/td><td>' + response[el].placementSize + '<\/td><td><a title="' + response[el].placementQuerySelector + '">' + response[el].placementQuerySelector + '<\/a><\/td><\/tr>';
                    }
                    
                    html += '<tr id="manual"><td colspan="3" style="text-align:center;">Manual Selector<\/td><\/tr><\/tbody><\/table>';

                    if (placementsTableContent !== html) {
                        placements.innerHTML = html;
                        placementsTableContent = html;
                    }

                    var manualInputRow = document.getElementById('manual');
                    var placementRows = document.getElementsByClassName('row');
                    
                    manualInputRow.addEventListener('click', function () {
                        clearInterval(refreshInterval);
                        manualSelector.classList.remove('hidden');
                        for (var i = 0; i < placementRows.length; i++) {
                            placementRows[i].removeAttribute('selected');
                        }
                        this.setAttribute('selected', '');
                        if (inputQs.value.length) {
                            highlightPlacement(null, inputQs.value.replace(/\//g, '\\/'));
                        }
                    });

                    response.forEach(function (elem) {
                        try {
                            placementRows[elem.id - 1].addEventListener('click', function () {
                                clearInterval(refreshInterval);
                                manualInputRow.removeAttribute('selected');
                                manualSelector.classList.add('hidden');
                                for (var i = 0; i < placementRows.length; i++) {
                                    placementRows[i].removeAttribute('selected');
                                }
                                this.setAttribute('selected', '');
                                highlightPlacement(elem.id);
                            });
                        } catch (ex) {}
                    });

                    getSizeList();
                }
            });
        });
    }

    // scan for placements while website loads
    function setListPlacementsInterval() {
        if (!refreshInterval) {
            var times = 20;
            refreshInterval = setInterval(function () {
                if (!times--) clearInterval(refreshInterval);
                listPlacements();
            }, 500);
        }
    }
    setListPlacementsInterval();

    function highlightPlacement(automatic, manual) {
        clearInterval(refreshInterval);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { cmd: 'highlightPlacement', automatic: automatic, manual: manual }, ignoreError);
        });
    }

    // refresh placement list
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (changes.sizelist) listPlacements();
    });

    function setInfoMessage(mode, msg, type) {
        var _mode, _msg, _type;
        if (!arguments.length) {
            _mode = '';
            _msg = '';
            _type = '';
        } else {
            _mode = mode;
            _msg = msg;
            _type = type;
        }

        if (_mode === 'inject') {
            infoMessageInject.innerHTML = _msg;
            infoMessageInject.className = _type;
        } else {
            infoMessageInject.innerHTML = _msg;
            infoMessageInject.className = _type;
        }
    }

    function getSizeList() {
        chrome.storage.local.get(['sizelist'], function (result) {
            if (result.sizelist) {
                sizes = result.sizelist;
            } else {
                sizes = ["300x250", "320x50", "300x50", "320x320", "320x100", "336x280", "300x300", "468x60", "300x600", "160x600", "120x600", "120x240", "180x150", "200x200", "250x250", "234x60", "240x400", "300x1050", "728x90", '970x250', '970x90', "930x180"];
                chrome.storage.local.set({
                    sizelist: sizes
                }, function (a) {});
            }

            var spans = sizeList.getElementsByTagName('span');

            while (spans[0]) spans[0].parentNode.removeChild(spans[0]);

            var rows = document.getElementsByClassName('row');
            var sizesInTable = [];

            for (var i = 0; i < rows.length; i++) {
                sizesInTable.push(rows[i].childNodes[1].innerHTML);
            }

            for (var size in sizes) {
                var sz = document.createElement('span');
                sz.className = sizesInTable.indexOf(sizes[size]) > -1 ? 'matched' : '';
                sz.innerHTML = '&nbsp;' + sizes[size] + '<span class="close">&nbsp;&times;&nbsp;</span>';
                sz.onclick = function () {
                    this.parentElement.removeChild(this);
                    var index = sizes.indexOf(this.textContent.trim().split(/\s/)[0]);
                    if (index > -1) {
                        sizes.splice(index, 1);
                        chrome.storage.local.set({
                            sizelist: sizes
                        }, function (a) {});
                    }
                }

                sizeList.appendChild(sz);
            }
        });
    }
    getSizeList();

    function handleInject() {
        if (!inputTag.value.length) {
            setInfoMessage('inject', 'insert tag HTML code', 'warning');
            return;
        }

        if (!document.getElementById('manual')) {
            setInfoMessage('inject', 'refresh the page', 'warning');
            return;
        }

        if (inputTag.value.match(/'/)) {
            setInfoMessage('inject', 'single quotes are not allowed', 'warning');
            return;
        }

        var tagHtml = inputTag.value;
        var autoPlacementSelected = Array.from(document.getElementsByClassName('row')).find(function (element) {
            return element.hasAttribute('selected');
        });
        var selectedPlacementId = autoPlacementSelected ? autoPlacementSelected.firstChild.innerHTML : false;
        var manualPlacementSelector = document.getElementById('manual').hasAttribute('selected') ? (inputQs.value.length ? inputQs.value.replace(/\//g, '\\\\/') : false) : false;
        var insertionSelected = manualSelector.getElementsByTagName('select')[0];
        var insertionType = manualPlacementSelector ? insertionSelected.options[insertionSelected.selectedIndex].value : 'overwrite';
        var hideIframe = document.getElementById('checkbox-hide-iframe').checked;

        if (selectedPlacementId || manualPlacementSelector) {
            setInfoMessage();
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    cmd: 'inject',
                    taghtml: tagHtml.trim(),
                    auto: selectedPlacementId,
                    manual: manualPlacementSelector,
                    insertion: insertionType,
                    hide: hideIframe
                }, ignoreError);
            });
        } else {
            setInfoMessage('inject', 'insert selector or select the placement', 'warning');
        }
    }

    // re-insert inputs
    inputTag.onchange = function (event) { inputChanged(event); }
    inputQs.onchange = function (event) { inputChanged(event); }
    manualInjectType.onchange = function (event) { inputChanged(event); }

    chrome.storage.local.get(['taghtml'], function (result) {
        if (result.taghtml) inputTag.value = result.taghtml;
    });
    chrome.storage.local.get(['qs'], function (result) {
        if (result.qs) inputQs.value = result.qs;
    });
    chrome.storage.local.get(['manualinjecttype'], function (result) {
        if (result.manualinjecttype) manualInjectType.value = result.manualinjecttype;
    });

    function inputChanged(evt) {
        if (evt.target == inputTag) chrome.storage.local.set({ taghtml: inputTag.value }, function (a) {});
        if (evt.target == inputQs) chrome.storage.local.set({ qs: inputQs.value }, function (a) {});
        if (evt.target == manualInjectType) chrome.storage.local.set({ manualinjecttype: manualInjectType.value }, function (a) {});
    }

    function ignoreError(r) {
        //https://stackoverflow.com/questions/28431505/unchecked-runtime-lasterror-when-using-chrome-api
        void chrome.runtime.lastError;
    }
}