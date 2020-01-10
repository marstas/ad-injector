# Tag injector
Chrome extension used for injecting ad tags into the website. @2018

## Instalation
* Download the repository and unzip it locally
* Open [chrome://extensions/](chrome://extensions/)
* Enable `Developer mode` (upper right corner)
* Click on `Load unpacked` and select the unzipped repository folder

## How to use
Click on the extension icon. Make sure it's turned on.

### Inject mode
* Refresh the page by clicking on the "refresh" icon. It bypasses the browser cache.
* Placements table will be automatically populated. If it takes longer than 10 seconds for the site to load, additionally click "Refresh table" button.
* If you can't find the desired placement in the list, check if the extension is scanning for the right placement sizes. Click "Show placement sizes" and adjust the size list accordingly.
* Select the placement by clicking on the particular table row. The placement will be highlighted every time the row is clicked. 
* It is also possible to enter a manual placement element selector (in `querySelector` fashion), by clicking on "Manual Selector" row, and choosing the insertion type.
* Insert the BN (example: 123211) or MID (example: 312338) and click "Go". The injection will happen immediately.
* In case the injected iframe needs to be hidden, select the "Hide iframe" checkbox.

### Respond mode
* Insert the required fields and click "Set".
* Refresh the page by clicking on the "refresh" icon. Active rules will be processed during the page load.
* Rule can be removed by clicking on the particular table row.
* The maximum of 5 rules are allowed.
* If you wish to respond with a tag, simply enter the tag ID (`BN`) in the URL field.
* To cancel the request, insert `404` in the URL field.
* **Important!** Beware that the request matching string can not match the replacement URL.


## Examples
### *querySelectors* &nbsp;(inject mode):
* `body`,&nbsp;&nbsp; `span`,&nbsp;&nbsp;`iframe`,&nbsp;&nbsp; `div`
* `#element-id`,&nbsp;&nbsp; `.element-class`,&nbsp;&nbsp;`.multiple.classes`
* `.element-class\.with-period`, `#element-id\.with-period` &nbsp;&nbsp; - if there's a period in the class name or ID, then it must be escaped.
* `div[id^="id-starts-with-"]`,&nbsp;&nbsp; `a[href="//www.some-page.com"]`
### *respond rules* &nbsp;(respond mode):
* Replaces &nbsp;&nbsp;`file1.js`&nbsp;&nbsp; with &nbsp;&nbsp;`file2.js`:<br>
`file1.js` &nbsp;&rarr;&nbsp; `https://www.some-page.com/somepath/file2.js`
* Replaces &nbsp;&nbsp;`file1.js`&nbsp;&nbsp; with a tag (BN) specified:<br>
`file1.js` &nbsp;&rarr;&nbsp; `123456;compoundSeqNo=1`
* Cancels the request to &nbsp;&nbsp;`file1.js`:<br>
`file1.js` &nbsp;&rarr;&nbsp; `404`
