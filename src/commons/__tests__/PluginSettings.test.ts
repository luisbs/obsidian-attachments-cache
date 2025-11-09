import { describe, expect, test } from 'vitest'
import type { CacheRule } from '../CacheRules'
import {
    type AttachmentsCacheSettings,
    DEFAULT_SETTINGS,
    prepareSettings,
} from '../PluginSettings'

const rules = Object.freeze<CacheRule[]>([
    {
        id: 'images',
        enabled: true,
        archive: true,
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
        archive: false,
        pattern: '*',
        storage: 'attachments/{notepath}',
        remotes: 'w *',
    },
])

// objects freezed to keep expected order
const settings = Object.freeze<Partial<AttachmentsCacheSettings>>({
    allow_characters: true,
    url_param_cache: 'cache',
    url_param_ignore: 'ignore',
})

describe('Testing PluginSettings utilities', () => {
    test('prepareSettings', () => {
        // newly installed plugins
        expect(prepareSettings(undefined)).toStrictEqual(DEFAULT_SETTINGS)
        expect(prepareSettings({})).toStrictEqual(DEFAULT_SETTINGS)

        // using custom Settings
        // ensure all settings rely on a default value
        expect(prepareSettings({ ...settings, cache_configs: rules })) //
            .toStrictEqual({
                ...DEFAULT_SETTINGS,
                ...settings,
                cache_rules: rules,
            })
    })
})
