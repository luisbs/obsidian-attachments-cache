import { readFileSync, writeFileSync } from 'node:fs'

const NEW_VERSION = process.env.npm_package_version

// update manifest.json with target version
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
manifest.version = NEW_VERSION
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'))

// update versions.json with target version and minAppVersion
const versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[NEW_VERSION] = manifest.minAppVersion
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'))
