import { resolve } from 'path'
import { defineConfig } from 'vite'
import builtins from 'builtin-modules'
import banner from 'vite-plugin-banner'
import pkg from '../package.json'

export function packageBanner() {
    return banner(
        [
            '/*!',
            ` * @copyright Copyright (c) 2022-present ${pkg.author.name}`,
            ` * @license ${pkg.name}@${pkg.version} is released under the ${pkg.license} license`,
            ` * @source ${pkg.repository.url}`,
            ' */',
        ].join('\n'),
    )
}

export function rollupOptions() {
    return {
        logLevel: 'info',
        treeshake: true,
        external: [
            'obsidian',
            'electron',
            '@codemirror/autocomplete',
            '@codemirror/closebrackets',
            '@codemirror/collab',
            '@codemirror/commands',
            '@codemirror/comment',
            '@codemirror/fold',
            '@codemirror/gutter',
            '@codemirror/highlight',
            '@codemirror/history',
            '@codemirror/language',
            '@codemirror/lint',
            '@codemirror/matchbrackets',
            '@codemirror/panel',
            '@codemirror/rangeset',
            '@codemirror/rectangular-selection',
            '@codemirror/search',
            '@codemirror/state',
            '@codemirror/stream-parser',
            '@codemirror/text',
            '@codemirror/tooltip',
            '@codemirror/view',
            ...builtins,
        ],
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    resolve: { alias: { '@': resolve(__dirname, '../src') } },

    plugins: [packageBanner()],

    build: {
        outDir: 'lib',
        target: 'es2022',
        sourcemap: true,
        rollupOptions: rollupOptions(),
        lib: {
            formats: ['es'],
            fileName: () => 'obsidian-attachments-cache.esm.js',
            entry: resolve(__dirname, '../src/index.ts'),
        },
    },
})
