import { describe, expect, test } from 'vitest'
import { prepareCacheRules, type CacheRule } from '../rules'

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
        { whitelisted: true, pattern: 'example.com/blog' },
        { whitelisted: true, pattern: '*' },
        { whitelisted: true, pattern: 'example.com' },
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
        { whitelisted: true, pattern: 'example.com/blog' },
        { whitelisted: true, pattern: 'example.com/images' },
        { whitelisted: true, pattern: 'example.com' },
        { whitelisted: true, pattern: 'images.org' },
        { whitelisted: true, pattern: '*' },
    ],
})

describe('Testing CacheRule utilities', () => {
    test('prepareCacheRules', () => {
        // alphabetical order 'files' > 'images' > 'papers'
        // but the user-defined order should be respected
        expect.soft(prepareCacheRules([U, A, B])).toStrictEqual([O, A, B])
        expect.soft(prepareCacheRules([A, B, U])).toStrictEqual([A, B, O])
        expect.soft(prepareCacheRules([B, U, A])).toStrictEqual([B, O, A])

        // keep only first apperiences, based on `id`
        expect.soft(prepareCacheRules([B, U, A, B])).toStrictEqual([B, O, A])
        expect.soft(prepareCacheRules([B, A, B, U])).toStrictEqual([B, A, O])
        expect.soft(prepareCacheRules([B, B, U, A])).toStrictEqual([B, O, A])
    })
})
