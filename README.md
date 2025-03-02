# [obsidian-attachments-cache](https://github.com/luisbs/obsidian-attachments-cache)

[![License: GPL v3](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/gpl-3)

If you search help about the **Settings** you can check the [documentation](./docs/settings.md).

## Summary

During the Obsidian render process, when an `img` is found:

1. Checks if the image is cached/should be cached.
2. Download the image into a vault folder if is not cached.
3. Modify the `img` element to use a the vault file.

> Note: the original note is not modified.

There already exists similar plugins, like:

- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images) doesn't have explicit support for Obsidian v1.0+
- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)

But the main difference is that they modify the base note, this plugin avoids that. The intentation is to keep the posibility to delete the caches or copy the note content and it should still work (with the remote urls).

## Features

- [x] Exposed API for thrid-party integration.
- [x] Whitelist/blacklist vault Vault paths to perform caching.
- [x] Whitelist/blacklist vault remote paths to perform caching.
- [x] For listed Vault paths define where to store the attachments.

---

## Instalation

### From source

You can activate this plugin, building from source by doing the following:

- Clone the repository
- Install the dependencies
- Run `pnpm build` or `npm run build` from a cli
- Copy the content of the repository `dist` folder to your vault, the path should look like `your-vault/.obsidian/plugins/obsidian-attachments-cache`
- Open your vault in _Obsidian_ and activate the newly installed plugin

### From within Obsidian

> I'm working ⚒️ on making this posible.

<!-- From Obsidian v1.1+, you can activate this plugin within Obsidian by doing the following:

- Open Settings > Third-party plugin
- Make sure Safe mode is **off**
- Click Browse community plugins
- Search for "Attachments Cache"
- Click Install
- Once installed, close the community plugins window and activate the newly installed plugin -->

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

By default any image rendered by a plugin may be cached, dependening on the [Plugin Priority](./docs/settings.md#plugin-priority).

But if the plugin uses _**async functions**_ the order defined by **Plugin Priority** is not enforced, in that situations this plugin runs before the thrid-party plugin has ended and the added images avoid been cached.

To prevent that situation on `'NORMAL'` priority 2 second is awaited before the cache is executed.
On `'HIGHER'` priority 10 seconds are awaited.
