# Settings

The next section explains the supported Settings.

### `Plugging LogLevel`

By default **LogLevel** is set to `'WARN'` this prevents the package from over-logging into the user console.

Changing the **LogLevel** to `'INFO'` or `'DEBUG'` will print to the console valuable information of the inner-workings of the plugging, details about why an URL is/isn't cached, etc.

---

### `Keep Special Characters`

When this setting is disabled any non-standard character is replaced with an underscore, to prevent problems on a paths.

### `URL Param Cache` & `URL Param Ignore`

> This Settings work if the **Note** has already matched an _enabled path_.

URL param, overrides standar cache rules on a per-link basis, and caches/ignores the attachment.
