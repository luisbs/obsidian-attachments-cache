import { describe, expect, test } from 'vitest'
import {
    type AttachmentsCacheSettings,
    DEFAULT_SETTINGS,
    prepareSettings,
} from '../PluginSettings'

// objects freezed to keep expected order
const settings = Object.freeze<Partial<AttachmentsCacheSettings>>({
    allow_characters: true,
    url_param_cache: 'cache',
    url_param_ignore: 'ignore',
    cache_rules: [
        {
            id: 'images',
            enabled: true,
            pattern: 'images/**',
            storage: 'attachments/images/{notename}',
            remotes: [
                'w example.com/blog/asd',
                'b example.com/blog',
                'w example.com/images',
                'b example.com',
                'w images.org',
                'b *',
            ].join('\n'),
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

describe('Testing PluginSettings utilities', () => {
    test('prepareSettings', () => {
        // newly installed plugins
        expect(prepareSettings(undefined)).toStrictEqual(DEFAULT_SETTINGS)
        expect(prepareSettings({})).toStrictEqual(DEFAULT_SETTINGS)

        // using custom Settings
        // ensure all settings rely on a default value
        // non-standard/deprecated settings should be removed
        expect(prepareSettings({ ...settings, deprecated: 'ignore' })) //
            .toStrictEqual({ ...DEFAULT_SETTINGS, ...settings })
    })
})
