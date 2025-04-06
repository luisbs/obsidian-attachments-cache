import { describe, expect, test } from 'vitest'
import {
    type AttachmentsCacheSettings,
    DEFAULT_SETTINGS,
    prepareSettings,
} from '../settings'

// objects freezed to keep expected order
const some = Object.freeze<Partial<AttachmentsCacheSettings>>({
    allow_characters: true,
    url_param_cache: 'cache',
    url_param_ignore: 'ignore',
    cache_rules: [
        {
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
        },
        {
            id: 'files',
            enabled: true,
            pattern: '*',
            target: 'attachments/{notepath}',
            remotes: [{ whitelisted: true, pattern: '*' }],
        },
    ],
})

describe('Testing settings utilities', () => {
    test('prepareSettings', () => {
        // newly installed plugins
        expect(prepareSettings(undefined)).toStrictEqual(DEFAULT_SETTINGS)
        expect(prepareSettings({})).toStrictEqual(DEFAULT_SETTINGS)

        // using custom Settings
        // ensure all settings rely on a default value
        // non-standard/deprecated settings should be removed
        expect(prepareSettings({ ...some, deprecated: 'ignore' })) //
            .toStrictEqual({ ...DEFAULT_SETTINGS, ...some })
    })
})
