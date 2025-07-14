# TODO

## Completed

- [x] Settings Page.
- [x] Support per-path URL lists.
- [x] Support glob patterns on Vault paths.
- [x] Whitelist/blacklist remote URLs to cache.
- [x] Support updating the attachment link on the note.
- [x] Support per-link overrides to cache/ignore an individual attachment.
- [x] Support per-note overrides to cache/ignore notes attachments.
- [x] Support per-note overrides to attach to the behavior of a CacheRule.
- [x] For listed Vault paths allow defining where to store the files.
- [x] For listed remote URLs allows path especificity ej: `example.com/images`
- [x] Expose API for thrid-party integration.
- [x] Established PostProcess priority.

## Behavior settings

- [ ] Add support for `{type}` extension groups path variables.
- [ ] Add option to early download when a link is pasted.
- [ ] Define a cache time limit (auto-clean old or unused attachments, to reduce vault size)
- [ ] Allow image resizing if possible, like:

  - Original image
  - Recompressed (convert jpg to webp if it can be done without loosing quality)
  - Thumb images

- [ ] Allow diferent cache naming behavior, like:

  - keep original image name
  - uuid-like naming
  - relative to note, like `note1-image1.jpg`
