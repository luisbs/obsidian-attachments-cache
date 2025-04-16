import { describe, expect, test } from 'vitest'
import {
    findCacheRule,
    prepareCacheRules,
    resolveCachePath,
    type CacheRule,
    type LoadedCacheRule,
} from '../CacheRules'
import { prepareSettings } from '../PluginSettings'

//
// objects freezed to keep expected order
//
const A = Object.freeze<LoadedCacheRule>({
    id: 'papers',
    enabled: false,
    pattern: 'notes/**',
    storage: '{folderpath}/attachments',
    remotes: 'w *',
})
const B = Object.freeze<LoadedCacheRule>({
    id: 'files',
    enabled: true,
    pattern: '*',
    storage: 'attachments/{notepath}',
    remotes: 'w *',
})
const O = Object.freeze<Partial<LoadedCacheRule>>({
    id: 'images',
    enabled: true,
    pattern: 'images/**',
    target: 'attachments/images/{notename}',
    remotes: [
        { whitelisted: true, pattern: 'images.org' },
        { whitelisted: true, pattern: 'example.com/blog/asd' },
        { whitelisted: false, pattern: 'example.com/blog' },
        { whitelisted: true, pattern: 'example.com/images' },
        { whitelisted: false, pattern: 'example.com' },
        { whitelisted: false, pattern: '*' },
    ],
})
const N = Object.freeze<CacheRule>({
    id: 'images',
    enabled: true,
    pattern: 'images/**',
    storage: 'attachments/images/{notename}',
    remotes: [
        'w images.org',
        'w example.com/blog/asd',
        'b example.com/blog',
        'w example.com/images',
        'b example.com',
        'b *',
    ].join('\n'),
})

describe('Testing CacheRules utilities', () => {
    test('prepareCacheRules', () => {
        // old format of `target` and `remotes` should be supported
        expect(prepareCacheRules([O, A, B])).toStrictEqual([N, A, B])

        // keep duplicates and respect order
        expect(prepareCacheRules([B, O, A, B])).toStrictEqual([B, N, A, B])
    })

    test('findCacheRule', () => {
        const fn = (
            rules: Array<Partial<LoadedCacheRule>>,
            notepath: string,
            frontmatter?: Record<string, unknown>,
        ) => {
            const settings = prepareSettings({ cache_rules: rules })
            return findCacheRule(settings, notepath, frontmatter)
        }

        // '*' pattern
        expect(fn([B], 'example.md')).toStrictEqual(B)
        expect(fn([A], 'example.md')).toBeUndefined()
        // minimatch pattern
        expect(fn([A], 'notes/example.md')).toStrictEqual(A)
        expect(fn([A], 'images/example.md')).toBeUndefined()

        // user-defined order should be respected
        expect(fn([A, B, N], 'images/example.md')).toStrictEqual(B)
        expect(fn([A, N, B], 'images/example.md')).toStrictEqual(N)

        // if provided use cache_rule
        expect(fn([N], 'example.md', { cache_rule: 'images' })).toStrictEqual(N)
        expect(fn([N], 'example.md', { cache_rule: 'imagez' })).toBeUndefined()
    })

    test('resolveCachePath', () => {
        const notepath = 'a/b/c/note1.md'
        const filename = 'img1.jpg'
        // prettier-ignore
        const storage_set: Array<[string, string]> = [
            // static paths are simpler to process
            ['attachments', `attachments/${filename}`],

            // variables storage path
            ['{notepath}', `a/b/c/note1/${filename}`],
            ['{notename}', `note1/${filename}`],
            ['{folderpath}', `a/b/c/${filename}`],
            ['{foldername}', `c/${filename}`],
            ['{ext}', `jpg/${filename}`],

            // slashes between variables are not enforced
            ['{notepath}{folderpath}', `a/b/c/note1a/b/c/${filename}`],

            // expected usage examples
            ['{folderpath}/{ext}', `a/b/c/jpg/${filename}`],
            ['attachments/{notename}', `attachments/note1/${filename}`],
            ['attachments/{notepath}', `attachments/a/b/c/note1/${filename}`],
            ['attachments/{foldername}/{notename}', `attachments/c/note1/${filename}`],
        ]

        // prettier-ignore
        for (const [storage, result] of storage_set) {
            expect.soft(resolveCachePath(storage, notepath, filename)).toBe(result)
        }
    })
})
