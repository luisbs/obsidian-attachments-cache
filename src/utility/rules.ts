import { URI } from '@luis.bs/obsidian-fnc/lib/utility/uri'
import { minimatch } from 'minimatch'
import { prepareRemoteRules, type RemoteRule } from './remotes'

export interface CacheRule {
    /** User defined id. */
    id: string
    /** Vault path glob pattern. */
    pattern: string
    /** Allow disabling the rule instead of been removed. */
    enabled: boolean
    /** Ordered list of remotes Whitelisted/Blacklisted. */
    remotes: RemoteRule[]
    /** Used alongside **mode**. */
    target: string
}

export function prepareCacheRules(...rules: CacheRule[][]): CacheRule[] {
    const _rules = [] as CacheRule[]

    for (const aRule of rules.flat()) {
        // keep only first CacheRule appariences
        if (_rules.some((bRule) => bRule.id === aRule.id)) continue
        _rules.push({ ...aRule, remotes: prepareRemoteRules(aRule.remotes) })
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
export function resolveCachePath(target: string, notepath: string): string {
    // resolve the attachments to a static folder
    if (!/[{}]/gi.test(target)) return target
    // resolve the attachments to a dynamic folder
    // use functions to avoid unnecesary calculations
    return target
        .replaceAll('{notepath}', () => URI.removeExt(notepath))
        .replaceAll('{notename}', () => URI.getBasename(notepath) ?? '')
        .replaceAll('{folderpath}', () => URI.getParent(notepath) ?? '')
        .replaceAll('{foldername}', () => {
            return URI.getBasename(URI.getParent(notepath) ?? '') ?? ''
        })
    // TODO: add support for `{ext}` and `{type}` variables
}
