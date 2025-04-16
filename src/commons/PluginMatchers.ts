import { type CacheRuleRemote } from './PluginState'

/** Test an URL against a domain pattern */
export function testUrlDomain(pattern: string, url: string): boolean {
    // if the user adds 'http', try an exact prefix match
    if (pattern.startsWith('http')) return url.startsWith(pattern)
    return new RegExp('^https?://(\\w+\\.)*' + pattern, 'g').test(url)
}

/** Test an URL against the listed RemoteRules. */
export function testCacheRemote(
    remotes: readonly CacheRuleRemote[],
    url: string,
): boolean {
    for (const { pattern, accepted } of remotes) {
        if (pattern === '*') return accepted
        if (testUrlDomain(pattern, url)) return accepted
    }
    return false
}

/** Test an URL against the expected URL param. */
export function testUrlParam(param: string, url: string): boolean {
    return new RegExp('[?&]' + param + '([&=\\s]|$)', 'i').test(url)
}

/** Test an URL against a URL filter on Frontmatter. */
export function testFmEntry(fm: unknown, param: string, url: string): boolean {
    // allow to ignore frontmatter matching
    if (fm === null || typeof fm !== 'object') return false
    if (!(param in fm)) return false

    const remotes: unknown = fm[param as keyof typeof fm]
    if (!remotes) return false

    // support strings like 'domain.com/images'
    if (typeof remotes === 'string') return testUrlDomain(remotes, url)
    if (!Array.isArray(remotes)) return false

    // support string-arrays like ['domain.com/images']
    for (const val of remotes) {
        if (typeof val !== 'string') continue
        if (testUrlDomain(val, url)) return true
    }

    return false
}
