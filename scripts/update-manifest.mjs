import { readFileSync, writeFileSync } from 'node:fs'
import { exec } from 'node:child_process'

const NEW_VERSION = process.env.npm_package_version

// update manifest.json with target version
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
manifest.version = NEW_VERSION
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'))

// update versions.json with target version and minAppVersion
const versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[NEW_VERSION] = manifest.minAppVersion
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'))

// feedback
console.log('🦋  Generated changes')
exec('git status --porcelain')

// feedback
console.log('⧗  Committing changes')
exec('git config user.name "github-actions[bot]"')
exec('git config user.email "github-actions[bot]@users.noreply.github.com"')
exec('git commit manifest.json versions.json -m"chore: sync plugin manifest"')

// feedback
console.log('⧗  Pushing changes')
exec('git push')
console.log('✔  Applied changes')
