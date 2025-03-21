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

export const DEFAULT_SETTINGS: AttachmentsCacheSettings = {
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
            pattern: '*',
            remotes: [{ whitelisted: false, pattern: '*' }],
            enabled: false,
            target: '',
        },
    ],
}

export async function prepareSettings(
    source: Promise<unknown>,
): Promise<AttachmentsCacheSettings> {
    const loaded = (await source) as AttachmentsCacheSettings | undefined
    if (!loaded) return DEFAULT_SETTINGS

    // ensure a fallback value is present
    return Object.assign({}, DEFAULT_SETTINGS, {
        ...loaded,
        // ensure order of rules and remotes
        cache_rules: prepareCacheRules([
            ...loaded.cache_rules,
            ...DEFAULT_SETTINGS.cache_rules,
        ]),
    })
}
