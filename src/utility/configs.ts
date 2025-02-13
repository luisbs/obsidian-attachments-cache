import type { CacheConfig } from '@/types'
import { compareBySpecificity } from './strings'
import { prepareRemotes } from './remotes'

export function prepareConfigs(configs: CacheConfig[]): CacheConfig[] {
    const result = [] as CacheConfig[]

    for (const a of configs) {
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

export function checkPattern(configs: CacheConfig[], _value: string): string[] {
    if (!_value) return ['invalid pattern']
    for (const config of configs) {
        if (config.pattern === _value) return [`duplicated pattern '${_value}'`]
    }
    return []
}
