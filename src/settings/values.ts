import type { LogLevel } from '@luis.bs/obsidian-fnc'
import type { CacheConfig } from '@/types'

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
    /** Stores the user defined vault paths to cache. */
    cache_configs: CacheConfig[]
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
    cache_configs: [
        {
            pattern: '*',
            remotes: [{ whitelisted: false, pattern: '*' }],
            enabled: false,
            target: '',
        },
    ],
}

function prepareHash(source: string): string {
    return source
        .replaceAll(' ', '-')
        .replaceAll(/[^\w-]/gi, '')
        .toLowerCase()
}

export function docs(
    name: string,
    desc: string | DocumentFragment,
): DocumentFragment {
    if (String.isString(desc)) {
        return createFragment((div) => {
            div.appendText(desc + '. Check the ')
            div.createEl('a', {
                text: 'Docs',
                href: `https://github.com/luisbs/obsidian-attachments-cache/blob/main/docs/settings.md#${prepareHash(name)}`,
            })
            div.appendText('.')
        })
    }

    desc.appendText('. Check the ')
    desc.createEl('a', {
        text: 'Docs',
        href: `https://github.com/luisbs/obsidian-attachments-cache/blob/main/docs/settings.md#${prepareHash(name)}`,
    })
    desc.appendText('.')
    return desc
}

//#region LogLevel
export type PluginLevel = keyof typeof LogLevel
export const LEVEL_LABELS: Record<PluginLevel, string> = {
    ERROR: 'ERROR',
    WARN: ' WARN',
    INFO: ' INFO',
    DEBUG: 'DEBUG',
    TRACE: 'TRACE',
}
//#endregion LogLevel

//#region Priorities
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
/** Labels for priority values */
export const PRIORITY_LABELS: Record<PluginPriority, string> = {
    LOWER: 'Only cache static attachments',
    NORMAL: 'Cache majority of attachments',
    HIGHER: 'Cache all posible attachments',
}
//#endregion Priorities
