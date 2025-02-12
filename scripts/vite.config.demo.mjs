import { resolve } from 'path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { packageBanner, rollupOptions } from './vite.config.lib.mjs'

// https://vitejs.dev/config/
export default defineConfig({
    resolve: { alias: { '@': resolve(__dirname, '../src') } },

    plugins: [
        packageBanner(),
        viteStaticCopy({
            targets: [
                { src: 'manifest.json', dest: './' },
                { src: 'src/styles.css', dest: './' },
            ],
        }),
    ],

    build: {
        emptyOutDir: false,
        outDir: 'demo/.obsidian/plugins/attachments-cache',
        target: 'es2022',
        sourcemap: true,
        rollupOptions: rollupOptions(),
        lib: {
            formats: ['cjs'],
            fileName: () => 'main.js',
            entry: resolve(__dirname, '../src/main.ts'),
        },
    },
})
