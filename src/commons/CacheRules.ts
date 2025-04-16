import { URI } from '@luis.bs/obsidian-fnc/lib/utility/uri'
import { minimatch } from 'minimatch'
import {
    type AttachmentsCacheState,
    type ExtendedCacheRule,
} from './PluginState'

/**
 * This settings are deprecated and will be keeped for at least 6 months.
 */
export type LoadedCacheRule = Omit<CacheRule, 'remotes'> & {
    /** @since 2025-04-15 */
    target?: string
    /** @since 2025-04-15 */
    remotes: string | Array<{ pattern: string; whitelisted: boolean }>
}

export interface CacheRule {
    /** User defined id. */
    id: string
    /** Allow disabling the rule instead of been removed. */
    enabled: boolean
    /** Vault path to store the attachments into. */
    storage: string
    /** Glob pattern to match the notes-path against. */
    pattern: string
    /** List of whitelisted/blacklisted remotes. */
    remotes: string
}

export const DEFAULT_CACHE_RULE = Object.freeze<CacheRule>({
    id: 'FALLBACK',
    enabled: true,
    storage: '{folderpath}',
    pattern: '*',
    remotes: 'w *',
})

export function prepareCacheRules(
    rules: Array<Partial<LoadedCacheRule>>,
): CacheRule[] {
    // keep user defined order
    return rules.map((rule) => {
        // prettier-ignore
        const remotes =
            Array.isArray(rule.remotes)
                ? rule.remotes.map((r) => `${r.whitelisted ? 'w' : 'b'} ${r.pattern}`).join('\n')
                : rule.remotes ?? ''

        return {
            id: rule.id ?? '',
            enabled: rule.enabled ?? false,
            storage: rule.storage ?? rule.target ?? '',
            pattern: rule.pattern ?? '',
            remotes,
        }
    })
}

/** Try to match the notepath against the listed CacheRules. */
export function findCacheRule(
    state: AttachmentsCacheState,
    notepath: string,
    frontmatter?: Record<string, unknown>,
): ExtendedCacheRule | undefined {
    // match based on the CacheRule reference
    if (frontmatter && state.note_param_rule in frontmatter) {
        const id = frontmatter[state.note_param_rule]
        if (typeof id === 'string') {
            for (const rule of state.cache_rules) {
                if (!rule.enabled) continue
                if (rule.id === id) return rule
            }
        }

        // if the CacheRule reference is not found, avoid matching
        return
    }

    // match based on the CacheRule path
    return state.cache_rules.find((rule) => {
        if (!rule.enabled) return false
        if (rule.pattern === '*') return true
        return minimatch(notepath, rule.pattern)
    })
}

/** Resolve a variable path. */
export function resolveCachePath(
    storage: string,
    notepath: string,
    filename: string,
): string {
    // resolve the attachments to a static folder
    if (!/[{}]/gi.test(storage)) return URI.join(storage, filename)

    // resolve the attachments to a dynamic folder
    // use functions to avoid unnecesary calculations
    const folderpath = storage
        // resolved from `notepath`
        .replaceAll('{notepath}', () => URI.removeExt(notepath))
        .replaceAll('{notename}', () => URI.getBasename(notepath) ?? '')
        .replaceAll('{folderpath}', () => URI.getParent(notepath) ?? '')
        .replaceAll('{foldername}', () => {
            return URI.getBasename(URI.getParent(notepath) ?? '') ?? ''
        })
        // resolved from `filename`
        .replaceAll('{ext}', () => URI.getExt(filename) ?? '')
    // TODO: add support for `{type}` variables

    return URI.join(folderpath, filename)
}
