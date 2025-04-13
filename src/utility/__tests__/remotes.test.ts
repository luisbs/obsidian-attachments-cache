import { describe, expect, test } from 'vitest'
import { prepareRemoteRules, type RemoteRule } from '../remotes'

// objects freezed to keep expected order
const remotes = Object.freeze<RemoteRule[]>([
    { whitelisted: true, pattern: 'example.com/blog/asd' },
    { whitelisted: false, pattern: 'example.com/blog' },
    { whitelisted: true, pattern: 'example.com/images' },
    { whitelisted: false, pattern: 'example.com' },
    { whitelisted: true, pattern: 'images.org' },
    { whitelisted: false, pattern: '*' },
])

describe('Testing RemoteRules utilities', () => {
    test('prepareRemoteRules', () => {
        const mix = [remotes, remotes].flat().sort(() => 0.5 - Math.random())

        // multiple tests avoids random case when mix yields the original order
        expect(prepareRemoteRules(mix)).toStrictEqual(remotes)
        expect(prepareRemoteRules(mix.reverse())).toStrictEqual(remotes)
    })
})
