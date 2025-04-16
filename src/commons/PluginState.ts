import {
    LogLevel,
    type LogLevelValue,
} from '@luis.bs/obsidian-fnc/lib/logging/index'
import { type CacheRule } from './CacheRules'
import {
    PRIORITY,
    PRIORITY_TIMEOUT,
    type AttachmentsCacheSettings,
} from './PluginSettings'

/**
 * Keep most of the `AttachmentsCacheSettings`
 * for the `AttachmentsCacheApi` to use only state.
 */
export type AttachmentsCacheState = Omit<
    AttachmentsCacheSettings,
    'plugin_level' | 'plugin_priority' | 'cache_rules'
> & {
    /** Calculated the minimun level to log while running. */
    plugin_level: LogLevelValue
    /** Calculated the **CachePostProcessor** priority. */
    plugin_priority: number
    /** Calculated the **CachePostProcessor** timeout. */
    plugin_timeout: number | undefined
    /** Extended `CacheRule` including pre-processed data. */
    cache_rules: ExtendedCacheRule[]
}

export interface ExtendedCacheRule extends CacheRule {
    /** Splited patterns from the `CacheRule['remotes']`. */
    remote_patterns: CacheRuleRemote[]
}

export interface CacheRuleRemote {
    /** Remote pattern to match against. */
    pattern: string
    /** Whether the pattern is accepted. */
    accepted: boolean
}

export function prepareState(
    settings: AttachmentsCacheSettings,
): AttachmentsCacheState {
    const cache_rules: ExtendedCacheRule[] = []
    for (const rule of settings.cache_rules) {
        // keep most settings unchanged
        cache_rules.push({
            ...rule,
            remote_patterns: preparePatterns(rule.remotes),
        })
    }

    // keep most settings unchanged
    return {
        ...settings,
        plugin_level: LogLevel[settings.plugin_level],
        plugin_priority: PRIORITY[settings.plugin_priority],
        plugin_timeout: PRIORITY_TIMEOUT[settings.plugin_priority],
        cache_rules,
    }
}

/**
 * Splits the remotes into a usable structure,
 * without making checks on the pattern,
 * since the source is checked when the user edits the Setting.
 */
export function preparePatterns(remotes: string): CacheRuleRemote[] {
    const result: CacheRuleRemote[] = []

    for (const line of remotes.split(/\n+/g)) {
        // ignore comment lines
        if (line.startsWith('#')) continue

        const [prefix, pattern] = line.split(' ')
        result.push({ pattern, accepted: prefix === 'w' })
    }

    return result
}
