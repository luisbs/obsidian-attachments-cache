import { parseFrontMatterEntry } from 'obsidian'
import type { CacheRule } from './rules'

/** Test an URL against the listed rule-remotes. */
export function testCacheRemote(rule: CacheRule, url: string): boolean {
    for (const { pattern, whitelisted } of rule.remotes) {
        if (pattern === '*') return whitelisted
        if (testUrlDomain(pattern, url)) return whitelisted
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
    if (fm === null) return false

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const value = parseFrontMatterEntry(fm, param)
    if (!value) return false

    // support strings like 'domain.com/images'
    if (String.isString(value)) return testUrlDomain(value, url)
    if (!Array.isArray(value)) return false

    // support string-arrays like ['domain.com/images']
    for (const val of value) {
        if (!String.isString(val)) continue
        if (testUrlDomain(val, url)) return true
    }

    return false
}
function testUrlDomain(pattern: string, value: string): boolean {
    // if the user adds 'http', try an exact prefix match
    if (pattern.startsWith('http')) return value.startsWith(pattern)
    return new RegExp('^https?://(\\w+\\.)*' + pattern, 'g').test(value)
}
