# Attachments Cache

[![License: GPL v3](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/gpl-3)

If you search help about the **Settings** you can check the [documentation](./docs/settings.md).

## Summary

This plugin for Obsidian, stores remote attachments (currently only images) locally inside the vault.

The note is **NOT** modified, this way even outside of the vault the attachments keep working with the remotes URL.

When the attachment is rendered in a note, the local version is used instead of the remote working as a local cache.

> The cached attachments can be deleted any time to free up disk space.

In detail, during the Obsidian render process, when an `img` is found:

1. The plugin checks if the image is cached/should be cached.
2. Download the image into a vault folder if is not cached.
3. Modify the `img` element to use the cached file inside the vault.

## Features

- [x] Exposed API for thrid-party integration.
- [x] Whitelist/blacklist vault vault paths to perform caching.
- [x] Whitelist/blacklist vault remote URLs to perform caching.
- [x] For listed Vault paths define where to store the attachments.
- [x] Allows override of rules on individual notes or remotes.

## Supported attachments file-formats

Based on the Obsidian supported [file-formats](https://help.obsidian.md/file-formats) the next attachments formats are been cached:

- [x] Images: `.avif`, `.bmp`, `.gif`, `.jpeg`, `.jpg`, `.png`, `.svg`, `.webp`
- [ ] Audio: `.flac`, `.m4a`, `.mp3`, `.ogg`, `.wav`, `.webm`, `.3gp`
- [ ] Video: `.mkv`, `.mov`, `.mp4`, `.ogv`, `.webm`
- [ ] PDF: `.pdf`

> The unmarked formats are not cached currently.
> Caching the missing files formats is a main objective for future releases.

---

## Instalation

### From within Obsidian

You can activate this plugin within Obsidian by doing the following:

- Open Settings > Third-party plugin
- Make sure Safe mode is **off**
- Click Browse community plugins
- Search for "Attachments Cache"
- Click Install
- Once installed, enable the plugin
- Then select "Attachments Cache" settings
- Configure the vault paths and URL remotes that should be cached

### From source

You can activate this plugin, building from source by doing the following:

- Clone the repository
- Install the dependencies
- Run `pnpm build:dist` or an equivalent.
- Copy the content of the repository `dist` folder to your vault, the path should look like `<path-to-your-vault>/.obsidian/plugins/attachments-cache`
- Open your vault in _Obsidian_ and activate the newly installed plugin

---

## Pricing

This plugin is provided to everyone for free, however if you would like to
say thanks or help support continued development, feel free to send a little
through the following method:

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/luisbs)

## Notes

The plugin is not on active development, new features or changes are developed when there is an oportunity. But issues and bugs will have especial priority.

### Thrid-party Integration

An API `AttachmentsCache` is exposed globally for easy integration.

For usage inside a plugin the methods `isPluginEnabled` and `getAPI` are exposed from an npm package named `@luis.bs/obsidian-attachments-cache`

```sh
pnpm add @luis.bs/obsidian-attachments-cache
```

On other environments where the package can not be used as a dependency, the API is attach to the global `window` object. The next declare can be used for development:

```ts
declare namespace AttachmentsCache {
  /** Test whether the attachments should be cached. */
  function mayCache(notepath: string, remote: string): boolean
  /** Test whether a remote file is already cached. */
  function isCached(notepath: string, remote: string): Promise<boolean>
  /** Tries to map a remote url into a Vault resourcePath. */
  function resource(notepath: string, remote: string): Promise<string | undefined>
  /** Tries to map a remote url into a Vault filePath. */
  function resolve(notepath: string, remote: string): Promise<string | undefined>
  /** Tries to cache a file locally and returns a Vault resourcePath. */
  function cache(notepath: string, remote: string): Promise<string | undefined>
}
```

## Troubleshooting

### An image rendered by another plugin is not been cached?

Plugins use [Markdown post processing](https://docs.obsidian.md/Plugins/Editor/Markdown+post+processing) to change the rendered view of the note.

By default any image rendered by a plugin may be cached, dependening on the [Cache priority](./docs/settings.md#cache-priority).

But if the plugin uses _**async functions**_ the order defined by **Cache priority** is not enforced, in that situations this plugin runs before the thrid-party plugin has ended and the added images avoid been cached.

To prevent that situation on `'NORMAL'` priority 2 second is awaited before the cache is executed.
On `'HIGHER'` priority 10 seconds are awaited.
