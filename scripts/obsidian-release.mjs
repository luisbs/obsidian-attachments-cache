import { rmSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const run = (command) => console.log(execSync(command).toString('utf8'))

const NEW_VERSION = process.env.npm_package_version

// read changes generated by @changeset/cli
const changelog = readFileSync('CHANGELOG.md', 'utf8')

// try to match a section headed by `## 1.4.2`
const header = `## ${NEW_VERSION}`
const start = changelog.indexOf(header)
const end = changelog.indexOf('## ', start + header.length)
const section = changelog.substring(start, end)

// prepare release notes
console.log('Preparing releseas-notes')
rmSync('release-notes.md', { force: true })
writeFileSync('release-notes.md', section)

// create release
console.log('Creating Release')
run(
    `gh release create "${NEW_VERSION}"` +
        ' dist/main.js styles.css manifest.json' +
        ' --notes-file release-notes.md' +
        ` --title "${NEW_VERSION}"`,
)

// clear artifacts
console.log('Artifacts Clean up')
rmSync('release-notes.md', { force: true })
