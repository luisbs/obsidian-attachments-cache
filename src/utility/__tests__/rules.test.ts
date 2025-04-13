import { describe, expect, test } from 'vitest'
import {
    findCacheRule,
    prepareCacheRules,
    resolveCachePath,
    type CacheRule,
} from '../rules'

//
// objects freezed to keep expected order
//
const A = Object.freeze<CacheRule>({
    id: 'papers',
    enabled: false,
    pattern: 'notes/**',
    storage: '{folderpath}/attachments',
    remotes: [{ whitelisted: true, pattern: '*' }],
})
const B = Object.freeze<CacheRule>({
    id: 'files',
    enabled: true,
    pattern: '*',
    storage: 'attachments/{notepath}',
    remotes: [{ whitelisted: true, pattern: '*' }],
})
const U = Object.freeze<CacheRule>({
    id: 'images',
    enabled: true,
    pattern: 'images/**',
    storage: 'attachments/images/{notename}',
    remotes: [
        { whitelisted: true, pattern: 'images.org' },
        { whitelisted: true, pattern: 'example.com/images' },
        { whitelisted: false, pattern: 'example.com/blog' },
        { whitelisted: false, pattern: '*' },
        { whitelisted: false, pattern: 'example.com' },
        { whitelisted: true, pattern: 'example.com/blog/asd' },
    ],
})
const O = Object.freeze<CacheRule>({
    id: 'images',
    enabled: true,
    pattern: 'images/**',
    storage: 'attachments/images/{notename}',
    remotes: [
        { whitelisted: true, pattern: 'example.com/blog/asd' },
        { whitelisted: false, pattern: 'example.com/blog' },
        { whitelisted: true, pattern: 'example.com/images' },
        { whitelisted: false, pattern: 'example.com' },
        { whitelisted: true, pattern: 'images.org' },
        { whitelisted: false, pattern: '*' },
    ],
})

describe('Testing CacheRules utilities', () => {
    test('prepareCacheRules', () => {
        // alphabetical order 'files' > 'images' > 'papers'
        // but the user-defined order should be respected
        expect(prepareCacheRules([U, A, B])).toStrictEqual([O, A, B])
        expect(prepareCacheRules([A, B, U])).toStrictEqual([A, B, O])
        expect(prepareCacheRules([B, U, A])).toStrictEqual([B, O, A])

        // keep only first apperiences, based on `id`
        expect(prepareCacheRules([B, U, A, B])).toStrictEqual([B, O, A])
        expect(prepareCacheRules([B, A, B, U])).toStrictEqual([B, A, O])
        expect(prepareCacheRules([B, B, U, A])).toStrictEqual([B, O, A])
    })

    test('findCacheRule', () => {
        // '*' pattern
        expect(findCacheRule([B], 'example.md')).toBe(B)
        expect(findCacheRule([A], 'example.md')).toBeUndefined()
        // minimatch pattern
        expect(findCacheRule([A], 'notes/example.md')).toBe(A)
        expect(findCacheRule([A], 'images/example.md')).toBeUndefined()

        // user-defined order should be respected
        expect(findCacheRule([A, B, O], 'images/example.md')).toBe(B)
        expect(findCacheRule([A, O, B], 'images/example.md')).toBe(O)
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
