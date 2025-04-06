import { describe, expect, test } from 'vitest'
import {
    testCacheRemote,
    testFmEntry,
    testUrlDomain,
    testUrlParam,
} from '../matchers'
import type { RemoteRule } from '../remotes'

const remotes = Object.freeze<RemoteRule[]>([
    { whitelisted: true, pattern: 'example.com/blog/asd' },
    { whitelisted: false, pattern: 'example.com/blog' },
    { whitelisted: true, pattern: 'example.com/images' },
    { whitelisted: false, pattern: 'example.com' },
    { whitelisted: true, pattern: 'images.org' },
    { whitelisted: false, pattern: '*' },
])

describe('Testing matchers utilities', () => {
    test('testUrlDomain', () => {
        // when protocol is present, enforce it
        const withProtocol = testUrlDomain.bind(null, 'https://example.org')
        expect(withProtocol('https://example.org/res/a.jpg')).toBe(true)
        expect(withProtocol('http://example.org/res/a.jpg')).toBe(false)
        expect(withProtocol('ftp://example.org/res/a.jpg')).toBe(false)

        // when protocol is missing, allow http and https
        const withoutProtocol = testUrlDomain.bind(null, 'example.org')
        expect(withoutProtocol('https://example.org/res/a.jpg')).toBe(true)
        expect(withoutProtocol('http://example.org/res/a.jpg')).toBe(true)
        expect(withoutProtocol('ftp://example.org/res/a.jpg')).toBe(false)

        // allow subdomains only when protocol is missing
        expect(withoutProtocol('http://sub.example.org/res/a.jpg')).toBe(true)
        expect(withProtocol('http://sub.example.org/res/a.jpg')).toBe(false)

        // respect deepness
        const deeperPath = testUrlDomain.bind(null, 'example.org/res/img')
        expect(withoutProtocol('http://example.org/res/img/a.jpg')).toBe(true)
        expect(deeperPath('http://example.org/res/img/a.jpg')).toBe(true)
        expect(deeperPath('http://example.org/res/a.jpg')).toBe(false)

        // respect pattern `res/img` is different from `res/img/`
        const patternA = testUrlDomain.bind(null, 'example.org/res/img')
        const patternB = testUrlDomain.bind(null, 'example.org/res/img/')
        expect(patternA('http://example.org/res/imga.jpg')).toBe(true)
        expect(patternB('http://example.org/res/imga.jpg')).toBe(false)
    })

    test('testCacheRemote', () => {
        const testRemote = testCacheRemote.bind(null, remotes)
        expect(testRemote('https://example.com/blog/asd/image.jpg')).toBe(true)
        expect(testRemote('https://example.com/blog/image.jpg')).toBe(false)
        expect(testRemote('https://example.org/image.jpg')).toBe(false)
    })

    test('testUrlParam', () => {
        const testParam = testUrlParam.bind(null, 'cache')
        expect(testParam('https://example.com/file.jpg?cache')).toBe(true)

        // values assigned to the param are ignored
        expect(testParam('https://example.com/file.jpg?cache=true')).toBe(true)
        expect(testParam('https://example.com/file.jpg?cache=false')).toBe(true)
        expect(testParam('https://example.com/file.jpg?cache=no')).toBe(true)

        // only recognize param_names
        expect(testParam('https://example.com/file.jpg?val=cache')).toBe(false)
        expect(testParam('https://example.com/cache.jpg')).toBe(false)
    })

    test('testFmEntry', () => {
        // unexpected values
        expect(testFmEntry(undefined, 'cache', 'meaningless')).toBe(false)
        expect(testFmEntry(['all'], 'cache', 'meaningless')).toBe(false)

        // null can be used to force a false result
        expect(testFmEntry(null, 'cache', 'meaningless')).toBe(false)

        //
        const fm = testFmEntry.bind(null, {
            first: 'example.com',
            second: 'http://example.com',
            third: ['example.com', 'https://example.org'],
        })

        // accept strings
        expect(fm('first', 'https://example.com/file.jpg')).toBe(true)
        expect(fm('first', 'https://example.org/file.jpg')).toBe(false)

        // support specifing protocol
        expect(fm('second', 'http://example.com/file.jpg')).toBe(true)
        expect(fm('second', 'https://example.com/file.jpg')).toBe(false)

        // accept string-arrays
        expect(fm('third', 'https://example.com/file.jpg')).toBe(true)
        expect(fm('third', 'https://example.org/file.jpg')).toBe(true)
        expect(fm('third', 'https://images.org/file.jpg')).toBe(false)
        expect(fm('third', 'http://example.org/file.jpg')).toBe(false)
        expect(fm('third', 'http://sub.example.org/file.jpg')).toBe(false)
    })
})
