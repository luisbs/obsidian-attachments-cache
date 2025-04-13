import { URI } from '@luis.bs/obsidian-fnc/lib/utility/uri'
import { minimatch } from 'minimatch'
import { prepareRemoteRules, type RemoteRule } from './remotes'

export interface CacheRule {
    /** User defined id. */
    id: string
    /** Allow disabling the rule instead of been removed. */
    enabled: boolean
    /** Vault path to store the attachments into. */
    storage: string
    /** Vault path glob pattern. */
    pattern: string
    /** Ordered list of remotes Whitelisted/Blacklisted. */
    remotes: RemoteRule[]

    /** @deprecated use `storage` instead. */
    target?: string
}

export function prepareCacheRules(...rules: CacheRule[][]): CacheRule[] {
    const _rules = [] as CacheRule[]

    for (const aRule of rules.flat()) {
        // keep only first CacheRule appariences
        if (_rules.some((bRule) => bRule.id === aRule.id)) continue
        // prettier-ignore
        _rules.push({
            id: aRule.id,
            enabled: aRule.enabled,
            // for the original installations to not fail jaja
            // eslint-disable-next-line
            storage: aRule.storage || aRule.target || '',
            pattern: aRule.pattern,
            remotes: prepareRemoteRules(aRule.remotes),
        })
    }

    // keep user defined order
    return _rules
}

/** Try to match the notepath against the listed CacheRules. */
export function findCacheRule(
    rules: CacheRule[],
    notepath: string,
): CacheRule | undefined {
    return rules.find((rule) => {
        if (rule.pattern === '*') return true
        return minimatch(notepath, rule.pattern)
    })
}

/** Resolve a variable path. */
export function resolveCachePath(storage: string, notepath: string): string {
    // resolve the attachments to a static folder
    if (!/[{}]/gi.test(storage)) return storage
    // resolve the attachments to a dynamic folder
    // use functions to avoid unnecesary calculations
    return storage
        .replaceAll('{notepath}', () => URI.removeExt(notepath))
        .replaceAll('{notename}', () => URI.getBasename(notepath) ?? '')
        .replaceAll('{folderpath}', () => URI.getParent(notepath) ?? '')
        .replaceAll('{foldername}', () => {
            return URI.getBasename(URI.getParent(notepath) ?? '') ?? ''
        })
    // TODO: add support for `{ext}` and `{type}` variables
}
