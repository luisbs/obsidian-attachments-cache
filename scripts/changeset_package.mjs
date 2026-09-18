import { execSync } from 'node:child_process'

const exec = (command) => execSync(command, { stdio: 'inherit' })

// build plugin
exec('pnpm build:dist')

// build library
exec('pnpm build:lib')

// feedback
console.log('🦋 Generated files')
exec('ls dist lib')

// ci:publish: pnpm build:lib && clean-pkg-json && changeset publish --no-git-tag
// ci:obsidian: git reset --hard HEAD && pnpm build:dist && node ./scripts/obsidian-release.mjs
