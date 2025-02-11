import { resolve } from 'path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import builtins from 'builtin-modules'
import banner from 'vite-plugin-banner'
import pkg from '../package.json'

const DEMO_PATH = 'demo/.obsidian/plugins/attachments-cache'

// https://vitejs.dev/config/
export default defineConfig((ctx) => {
    const PRD = ctx.mode === 'production'

    return {
        resolve: { alias: { '@': resolve(__dirname, '../src') } },

        plugins: [
            banner(
                [
                    '/*!',
                    ` * @copyright Copyright (c) 2022-present ${pkg.author.name}`,
                    ` * @license ${pkg.name}@${pkg.version} is released under the ${pkg.license} license`,
                    ` * @source ${pkg.repository.url}`,
                    ' */',
                ].join('\n'),
            ),
            viteStaticCopy({
                targets: [
                    { src: 'manifest.json', dest: './' },
                    { src: 'src/styles.css', dest: './' },
                ],
            }),
        ],

        esbuild: {
            keepNames: true,
            // remove logs on production
            drop: PRD ? ['debugger'] : [],
            pure: PRD ? ['console.trace', 'console.debug', 'console.log'] : [],
        },

        build: {
            target: 'es2022',
            outDir: PRD ? resolve('dist') : resolve(DEMO_PATH),
            sourcemap: PRD ? false : 'inline',
            emptyOutDir: PRD,
            lib: {
                entry: resolve(__dirname, '../src/main.ts'),
                formats: ['cjs'],
                fileName: () => 'main.js',
            },
            rollupOptions: {
                output: { exports: 'named' },
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
            },
        },
    }
})
