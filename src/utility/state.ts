import type {
    AttachmentsCachePlugin,
    CacheConfig,
    CacheMatcher,
    FrontmatterMatcher,
    PluginState,
    RemoteMatcher,
} from '@/types'
import { Logger, URI, URL } from '@luis.bs/obsidian-fnc'
import { App, parseFrontMatterEntry, requestUrl } from 'obsidian'
import { minimatch } from 'minimatch'
import { AttachmentError } from './AttachmentError'
import { getMimeExt } from './strings'

export function prepareState(plugin: AttachmentsCachePlugin): PluginState {
    return {
        cache_matchers: configMatchers(plugin.settings.cache_configs),
        url_cache_matcher: remoteMatcher(plugin.settings.url_param_cache),
        url_ignore_matcher: remoteMatcher(plugin.settings.url_param_ignore),
        note_cache_matcher: frontmatterMatcher(
            plugin.app,
            plugin.settings.note_param_cache,
        ),
        note_ignore_matcher: frontmatterMatcher(
            plugin.app,
            plugin.settings.note_param_ignore,
        ),
    }
}

/** Generates a matcher, that users Frontmatter params. */
function frontmatterMatcher(
    app: App,
    note_param = 'fallback_param',
): FrontmatterMatcher {
    return (notepath: string, remote: string) => {
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

/** Generates a matcher, that detects the presence of an URL param. */
function remoteMatcher(url_param = 'fallback_param'): RemoteMatcher {
    const regex = new RegExp('[?&]' + url_param + '([&=\\s]|$)', 'i')
    return (remote: string) => regex.test(remote)
}

function configMatchers(configs: CacheConfig[]): CacheMatcher[] {
    return configs.map((config) => {
        // default: alongside the note
        // the prefix '/' is used to force the path inside the vault
        let resolve = (_path: string) => URI.getParent(_path) ?? '/'

        switch (config.mode) {
            case 'NOTE-FOLDER': // alongside the note in a subfolder with the targetPath as name
                resolve = (_path: string) =>
                    URI.join(URI.getParent(_path), config.target)
                break
            case 'TARGET-PATH': // inside the targetPath replating the note-path, without `.md`
                resolve = (_path: string) =>
                    URI.join(config.target, URI.removeExt(_path))
                break
            case 'TARGET-NOTE': // inside the targetPath in a folder named as the note, without `.md`
                resolve = (_path: string) =>
                    URI.join(config.target, URI.getBasename(_path))
                break
            case 'TARGET': // directly inside the targetPath
                resolve = () => config.target
                break
        }

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
            source: Object.freeze(config),
            isEnabled: () => config.enabled,
            testRemote,
            testPath,
            resolve,
        }
    })
}

/**
 * Request the metadata of a file, to determine the file extension.
 * @throws {AttachmentError}
 */
export async function getRemoteExt(url: string, log: Logger): Promise<string> {
    log.debug(`Resolving extension for ${url}`)

    const referer = URL.getOrigin(url)
    const response = await requestUrl({
        url: url,
        throw: false,
        method: 'HEAD',
        headers: { Referer: referer ? referer + '/' : '' },
    })

    AttachmentError.assertResponse(url, response, 'url-request-head')
    return getMimeExt(response.headers['content-type'])
}

/**
 * Downloads the content of a file.
 * @throws {AttachmentError}
 */
export async function getRemoteContent(
    url: string,
    log: Logger,
): Promise<ArrayBuffer> {
    log.debug(`Downloading ${url}`)

    const referer = URL.getOrigin(url)
    const response = await requestUrl({
        url: url,
        throw: false,
        method: 'GET',
        headers: { Referer: referer ? referer + '/' : '' },
    })

    AttachmentError.assertResponse(url, response, 'url-request-get')
    return response.arrayBuffer
}
