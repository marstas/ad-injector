# Ad Injector
Chrome extension used for injecting ads into websites.

## Install
* [Chrome Web Store](https://chrome.google.com/webstore/detail/adform-tag-injector/fnajiaffpfagancgffbdkolmnkigcfka)

## How to use
* Open extension popup.
* If necessary, refresh the website by clicking on "__Refresh site__" button. It bypasses the browser cache.
* Placements will be listed in a table. If site loads more than 10 seconds, additionally click "__Refresh table__" button.
* Add/remove placement dimensions by expanding "__Placement size list__".
* Select the placement by clicking on particular table row.
* Click on "__Manual Selector__" row in need for manual placement selection. Use `querySelector` syntax (see examples below). This option also allows you to select the insertion type.
* Enter tag HTML code into the textbox. __Note__: single quotes and relative URLs (starting "//") are not allowed.
* Use quick action row for common tag templates and insert the tag ID (BN or MID) where necessary.
* Tick "__Hide iframe__" in case the injected iframe needs to be hidden.
* Click "__Inject__" button.

## Manual Selector examples
* `body`,&nbsp;&nbsp; `span`,&nbsp;&nbsp;`iframe`,&nbsp;&nbsp; `div`
* `#element-id`,&nbsp;&nbsp; `.element-class`,&nbsp;&nbsp;`.multiple.classes`
* `.element-class\.with-period`, `#element-id\.with-period` &nbsp;&nbsp; - periods in class name or ID must be escaped.
* `div[id^="id-starts-with-"]`,&nbsp;&nbsp; `a[href="//www.some-page.com"]`
