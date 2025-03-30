import type { LogLevel } from '@luis.bs/obsidian-fnc'
import { prepareCacheRules, type CacheRule } from './rules'

export type PluginLevel = keyof typeof LogLevel

/** Utility type to map priority values. */
export type PluginPriority = 'LOWER' | 'NORMAL' | 'HIGHER'
/** Priority behavior: `higher = after` */
export const PRIORITY: Record<PluginPriority, number> = {
    // ! any value lower than 0 will ignore user-written elements
    /** Only caches user-written markdown. */
    LOWER: 0,
    /** Caches **PostProcessors** with default priority `0`. */
    NORMAL: 1,
    /** Only ignores the highest priority `Number.MAX_SAFE_INTEGER` */
    HIGHER: Number.MAX_SAFE_INTEGER - 1,
}
export const PRIORITY_TIMEOUT: Partial<Record<PluginPriority, number>> = {
    /** Sleep for 2 seconds to allow for async process to render. */
    NORMAL: 2000,
    /** Sleep for 10 seconds to allow for slow process to render. */
    HIGHER: 10000,
}

export interface AttachmentsCacheSettings {
    /** Defines the minimun level to log while running. */
    plugin_level: PluginLevel
    /** Defines the **CachePostProcessor** priority. */
    plugin_priority: PluginPriority
    /** Stores the user preference over `UTF-8` characters. */
    allow_characters: boolean
    /** User defined URL param to cache, overrides standard rules. */
    url_param_cache: string
    /** User defined URL param to ignore, overrides standard rules. */
    url_param_ignore: string
    /** User defined Frontmatter param to cache, overrides standard rules. */
    note_param_cache: string
    /** User defined Frontmatter param to ignore, overrides standard rules. */
    note_param_ignore: string
    /** User defined cache rules. */
    cache_rules: CacheRule[]
}

export const DEFAULT_SETTINGS: AttachmentsCacheSettings = Object.freeze({
    // * 'WARN' level to force the user to choose a lower level when is required
    // * this decition, prevents the console from been overpopulated by default
    plugin_level: 'WARN',
    // * 'NORMAL' priority to cache user-written markdown
    // * and PostProcessors with default priority
    plugin_priority: 'NORMAL',
    //
    allow_characters: false,
    url_param_cache: 'cache_file',
    url_param_ignore: 'ignore_file',
    note_param_cache: 'cache_from',
    note_param_ignore: 'cache_unless',
    cache_rules: [
        {
            id: 'FALLBACK',
            pattern: '*',
            enabled: true,
            remotes: [{ whitelisted: true, pattern: '*' }],
            target: '{folderpath}',
        },
    ],
})

export function prepareSettings(settings: unknown): AttachmentsCacheSettings {
    if (!settings || typeof settings !== 'object') return DEFAULT_SETTINGS
    const s = settings as Partial<AttachmentsCacheSettings>

    // prettier-ignore
    return {
        // ensure fallback values are present
        // ignore/remove any non-standard/deprecated settings
        plugin_level:      s.plugin_level      ?? DEFAULT_SETTINGS.plugin_level,
        plugin_priority:   s.plugin_priority   ?? DEFAULT_SETTINGS.plugin_priority,
        allow_characters:  s.allow_characters  ?? DEFAULT_SETTINGS.allow_characters,
        url_param_cache:   s.url_param_cache   ?? DEFAULT_SETTINGS.url_param_cache,
        url_param_ignore:  s.url_param_ignore  ?? DEFAULT_SETTINGS.url_param_ignore,
        note_param_cache:  s.note_param_cache  ?? DEFAULT_SETTINGS.note_param_cache,
        note_param_ignore: s.note_param_ignore ?? DEFAULT_SETTINGS.note_param_ignore,

        // ensure correct sorting of RemoteRules
        cache_rules: prepareCacheRules(s.cache_rules ?? DEFAULT_SETTINGS.cache_rules),
    }
}
