# @luis.bs/obsidian-attachments-cache

## 0.6.1

### Patch Changes

- 19130d4: Fixed loading deprecated cache_configs setting

## 0.6.0

### Minor Changes

- 1fe37e2: Consolidation of the plugin refactoring

### Patch Changes

- d8d9647: Removed CacheRule remotes whitelist/blacklist settings
- b27c4f9: Added notice about supported file formats
- 45c0c7b: Defaults change to cache attachments when freshly installed
- a9546d3: Avoid the attachment from been downloaded twice while it's been cached
- 8cff131: Add support for `{ext}` storage variable
- beb30c4: Add `cache_rule` override

## 0.5.6

### Patch Changes

- cf5a745: Simplify attachment storage UI
- 3419604: Support path variables on **Attachments storage** setting inspired from [Attachment Management](https://github.com/trganda/obsidian-attachment-management) plugin
- a1759da: Use _attachments storage modes_ similar to standard Obsidian attachments setting.

## 0.5.5

### Patch Changes

- e25b75b: Use sentence case on Settings UI

## 0.5.4

### Patch Changes

- 98c5f57: Changed README to extend the plugin behavior

## 0.5.3

### Patch Changes

- cecd0ac: Dropped node packages

## 0.5.2

### Patch Changes

- 72ecdfc: Follow Obsidian's plugin guidelines whenever possible

## 0.5.1

### Patch Changes

- c7d879c: Defined behavior with async PostProcess

## 0.5.0

### Minor Changes

- 170c7ef: Add customization of postprocessor sortOrder
- a4dcbb6: Added support for per-note overrides

### Patch Changes

- 29b84d7: Isolated Settings details into derived file

## 0.4.4

### Patch Changes

- f0bfe15: Fixed automated release missing GH_TOKEN

## 0.4.3

### Patch Changes

- d661319: Test on Github Release

## 0.4.2

### Patch Changes

- 5bf2b9a: Testing changeset/action fork

## 0.4.1

### Patch Changes

- 587bfe7: Split on vite scripts for dist
- f34783f: First npm publication

## 0.4.0

### Minor Changes

- de46b65: Added utility functions to include the API
- fb2bb64: Added release workflow scripts

### Patch Changes

- dddc4df: Clean up on logging
- 2d7459f: Replaced image references with attachment
- 59fb511: Avoid changeset release git tag
- c8c30a4: Environment upgrade
- 2ba191c: Enforce styling on legacy code
- 3e34c8a: Changed logging behavior of Plugin
- 04590cc: Added build script for npm library
- 70efe5f: Push changes on the manifest during workflow
- 0c18d81: Addopted 0-mayor versioning
- 1cde51e: Added usage of a APP_TOKEN on release workflow
