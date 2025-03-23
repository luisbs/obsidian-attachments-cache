import { URI } from '@luis.bs/obsidian-fnc'
import { minimatch } from 'minimatch'
import { parseFrontMatterEntry } from 'obsidian'
import type { CacheRule } from './rules'

/** Resolve the attachments path from the notepath. */
export type PathResolver = (notepath: string) => string
/** Generates a resolver for paths with variable parts. */
export function pathResolver(target: string): PathResolver {
    // adds the attachments to a static folder
    if (!/[{}]/gi.test(target)) return () => target
    // adds the attachments to a dynamic folder
    return (note: string) => {
        // use functions to avoid unnecesary calculations
        return target
            .replaceAll('{notepath}', () => URI.removeExt(note))
            .replaceAll('{notename}', () => URI.getBasename(note) ?? '')
            .replaceAll('{folderpath}', () => URI.getParent(note) ?? '')
            .replaceAll('{foldername}', () => {
                return URI.getBasename(URI.getParent(note) ?? '') ?? ''
            })
    }
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
