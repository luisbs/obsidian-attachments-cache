import { prepareRemotes, type RemoteRule } from './remotes'
import { compareBySpecificity } from './strings'

export interface CacheRule {
    /** Vault path glob pattern. */
    pattern: string
    /** Ordered list of remotes Whitelisted/Blacklisted. */
    remotes: RemoteRule[]
    /** Can be disabled instead of been removed. */
    enabled: boolean
    /** Used alongside **mode**. */
    target: string
}

export function prepareCacheRules(rules: CacheRule[]): CacheRule[] {
    const result = [] as CacheRule[]

    for (const a of rules) {
        // if is unique, keep it
        const bIndex = result.findIndex((b) => b.pattern === a.pattern)
        if (bIndex === -1) {
            // ensure remotes are sorted
            result.push({ ...a, remotes: prepareRemotes(a.remotes) })
            continue
        }

        // when duplicates, keep the more specific one
        if (a.remotes.length > result[bIndex].remotes.length) {
            // ensure remotes are sorted
            result[bIndex] = { ...a, remotes: prepareRemotes(a.remotes) }
        }
    }

    // ensure sorting of paths
    return result.sort((a, b) => compareBySpecificity(a.pattern, b.pattern))
}

export function checkPattern(rules: CacheRule[], _value: string): string[] {
    if (!_value) return ['invalid pattern']
    for (const rule of rules) {
        if (rule.pattern === _value) return [`duplicated pattern '${_value}'`]
    }
    return []
}
