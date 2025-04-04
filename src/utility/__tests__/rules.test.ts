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
    target: '{folderpath}/attachments',
    remotes: [{ whitelisted: true, pattern: '*' }],
})
const B = Object.freeze<CacheRule>({
    id: 'files',
    enabled: true,
    pattern: '*',
    target: 'attachments/{notepath}',
    remotes: [{ whitelisted: true, pattern: '*' }],
})
const U = Object.freeze<CacheRule>({
    id: 'images',
    enabled: true,
    pattern: 'images/**',
    target: 'attachments/images/{notename}',
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
    target: 'attachments/images/{notename}',
    remotes: [
        { whitelisted: true, pattern: 'example.com/blog/asd' },
        { whitelisted: false, pattern: 'example.com/blog' },
        { whitelisted: true, pattern: 'example.com/images' },
        { whitelisted: false, pattern: 'example.com' },
        { whitelisted: true, pattern: 'images.org' },
        { whitelisted: false, pattern: '*' },
    ],
})

describe('Testing CacheRule utilities', () => {
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
        // static target path
        expect(resolveCachePath('attachments', 'a/b/c/note.md')) //
            .toBe('attachments')

        // variables target path
        expect(resolveCachePath('{notepath}', 'a/b/c/note.md')) //
            .toBe('a/b/c/note')
        expect(resolveCachePath('{notename}', 'a/b/c/note.md')) //
            .toBe('note')
        expect(resolveCachePath('{folderpath}', 'a/b/c/note.md')) //
            .toBe('a/b/c/c')
        expect(resolveCachePath('{foldername}', 'a/b/c/note.md')) //
            .toBe('c')
        // slashes between variables are not enforced
        expect(resolveCachePath('{notepath}{folderpath}', 'a/b/c/note.md')) //
            .toBe('a/b/c/examplea/b/c')

        // expected usage examples
        expect(resolveCachePath('attachments/{notename}', 'a/b/c/note.md')) //
            .toBe('attachments/note')
        expect(resolveCachePath('attachments/{notepath}', 'a/b/c/note.md')) //
            .toBe('attachments/a/b/c/note')
        expect(resolveCachePath('__/{foldername}/{notename}', 'a/b/c/note.md')) //
            .toBe('__/c/note')
    })
})
