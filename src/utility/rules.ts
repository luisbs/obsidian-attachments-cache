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
