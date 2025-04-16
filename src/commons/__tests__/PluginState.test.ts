import { describe, expect, test } from 'vitest'
import {
    DEFAULT_SETTINGS,
    type AttachmentsCacheSettings,
} from '../PluginSettings'
import {
    preparePatterns,
    prepareState,
    type AttachmentsCacheState,
    type CacheRuleRemote,
} from '../PluginState'

const remotes = Object.freeze(
    [
        '# comments should be supported',
        'w example.com/blog/asd',
        'b example.com/blog',
        'w example.com/images',
        'b example.com',
        'w images.org',
        '',
        '# fallback behavior',
        'b *',
    ].join('\n'),
)

const remote_patterns = Object.freeze<CacheRuleRemote[]>([
    { accepted: true, pattern: 'example.com/blog/asd' },
    { accepted: false, pattern: 'example.com/blog' },
    { accepted: true, pattern: 'example.com/images' },
    { accepted: false, pattern: 'example.com' },
    { accepted: true, pattern: 'images.org' },
    { accepted: false, pattern: '*' },
])

const settings = Object.freeze<AttachmentsCacheSettings>({
    ...DEFAULT_SETTINGS,
    plugin_level: 'WARN',
    plugin_priority: 'NORMAL',
    cache_rules: [
        {
            id: 'images',
            enabled: true,
            pattern: 'images/**',
            storage: 'attachments/images/{notename}',
            remotes: remotes,
        },
        {
            id: 'files',
            enabled: true,
            pattern: '*',
            storage: 'attachments/{notepath}',
            remotes: 'w *',
        },
    ],
})

const state = Object.freeze<AttachmentsCacheState>({
    ...DEFAULT_SETTINGS,
    plugin_level: 4,
    plugin_priority: 1,
    plugin_timeout: 2000,
    cache_rules: [
        {
            id: 'images',
            enabled: true,
            pattern: 'images/**',
            storage: 'attachments/images/{notename}',
            remotes: remotes,
            remote_patterns: [...remote_patterns],
        },
        {
            id: 'files',
            enabled: true,
            pattern: '*',
            storage: 'attachments/{notepath}',
            remotes: 'w *',
            remote_patterns: [{ accepted: true, pattern: '*' }],
        },
    ],
})

describe('Testing PluginState utilities', () => {
    test('prepareState', () => {
        expect(prepareState(settings)).toStrictEqual(state)
    })

    test('preparePatterns', () => {
        expect(preparePatterns(remotes)).toStrictEqual(remote_patterns)
    })
})
