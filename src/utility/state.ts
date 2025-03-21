import { URI } from '@luis.bs/obsidian-fnc'
import { minimatch } from 'minimatch'
import { type App, parseFrontMatterEntry } from 'obsidian'
import type { CacheRule } from './rules'
import type { AttachmentsCacheSettings } from './settings'

/** Test the remote against an URL-override rule. */
export type RemoteMatcher = (remote: string) => boolean
/** Test the remote against an Note-override rule. */
export type FrontmatterMatcher = (
    app: App,
    notepath: string,
    remote: string,
) => boolean

export interface RuleMatcher {
    /** Determinates if the rule is enabled. */
    isEnabled(): boolean
    /** Checks if the remote matches. */
    testRemote(remote: string): boolean
    /** Checks if the path matches. */
    testPath(notepath: string): boolean
    /** Determinates the cachePath for the files. */
    resolve(notepath: string): string
}

export interface AttachmentsCacheState {
    /** Pre-calculated path matchers. */
    cache_matchers: RuleMatcher[]
    /** Pre-calculated URL param matcher. */
    url_cache_matcher: RemoteMatcher
    /** Pre-calculated URL param matcher. */
    url_ignore_matcher: RemoteMatcher
    /** Pre-calculated Frontmatter param matcher. */
    note_cache_matcher: FrontmatterMatcher
    /** Pre-calculated Frontmatter param matcher. */
    note_ignore_matcher: FrontmatterMatcher
}

export function prepareState(
    settings: AttachmentsCacheSettings,
): AttachmentsCacheState {
    return {
        cache_matchers: configMatchers(settings.cache_rules),
        url_cache_matcher: remoteMatcher(settings.url_param_cache),
        url_ignore_matcher: remoteMatcher(settings.url_param_ignore),
        note_cache_matcher: frontmatterMatcher(settings.note_param_cache),
        note_ignore_matcher: frontmatterMatcher(settings.note_param_ignore),
    }
}

function configMatchers(configs: CacheRule[]): RuleMatcher[] {
    return configs.map((config) => {
        const testPath =
            config.pattern !== '*'
                ? (_notepath: string) => minimatch(_notepath, config.pattern)
                : () => true
        const testRemote = (_remote: string) => {
            for (const { pattern, whitelisted } of config.remotes) {
                if (pattern === '*') return whitelisted
                if (testUrl(pattern, _remote)) return whitelisted
            }
            return false
        }

        return {
            isEnabled: () => config.enabled,
            source: Object.freeze(config),
            resolve: pathResolver(config.target),
            testPath,
            testRemote,
        }
    })
}

/** Generates a resolver for paths with variable parts. */
export function pathResolver(target: string): RuleMatcher['resolve'] {
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

/** Generates a matcher, against the remote URL. */
function remoteMatcher(url_param = 'fallback_param'): RemoteMatcher {
    const regex = new RegExp('[?&]' + url_param + '([&=\\s]|$)', 'i')
    return (remote: string) => regex.test(remote)
}

/** Generates a matcher, against the file Frontmatter. */
function frontmatterMatcher(note_param = 'fallback_param'): FrontmatterMatcher {
    return (app: App, notepath: string, remote: string) => {
        const metadata = app.metadataCache.getCache(notepath)
        if (!metadata?.frontmatter) return false

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const value = parseFrontMatterEntry(metadata.frontmatter, note_param)
        if (!value) return false

        // support strings like 'domain.com/images'
        if (String.isString(value)) return testUrl(value, remote)
        if (!Array.isArray(value)) return false

        // support string-arrays like ['domain.com/images']
        for (const val of value) {
            if (!String.isString(val)) continue
            if (testUrl(val, remote)) return true
        }

        return false
    }
}

function testUrl(pattern: string, value: string): boolean {
    // if the user adds 'http', try an exact prefix match
    if (pattern.startsWith('http')) return value.startsWith(pattern)
    return new RegExp('^https?://(\\w+\\.)*' + pattern, 'g').test(value)
}
