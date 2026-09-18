import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const exec = (command) => execSync(command, { stdio: 'inherit' })

// bump version
console.log('🦋 Versioning changes')
exec('pnpm changeset version')
console.log() // spacing

// retrieve new version
const NEW_VERSION = JSON.parse(readFileSync('package.json', 'utf8')).version

// update manifest.json with target version
const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))
manifest.version = NEW_VERSION
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t'))

// update versions.json with target version and minAppVersion
const versions = JSON.parse(readFileSync('versions.json', 'utf8'))
versions[NEW_VERSION] = manifest.minAppVersion
writeFileSync('versions.json', JSON.stringify(versions, null, '\t'))

// feedback
console.log('🦋 Generated changes')
exec('git status --porcelain')
