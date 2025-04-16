import { type Logger, type LoggingGroup, URI, URL } from '@luis.bs/obsidian-fnc'
import { normalizePath, requestUrl } from 'obsidian'
import { AttachmentError } from './commons/AttachmentError'
import {
    type CacheRule,
    findCacheRule,
    resolveCachePath,
} from './commons/CacheRules'
import {
    testCacheRemote,
    testFmEntry,
    testUrlParam,
} from './commons/PluginMatchers'
import type { AttachmentsCacheApi } from './lib'
import type AttachmentsCachePlugin from './main'

export class AttachmentsCache implements AttachmentsCacheApi {
    #log: Logger
    #plugin: AttachmentsCachePlugin
    #memo = new Map<string, undefined | string>()

    constructor(plugin: AttachmentsCachePlugin) {
        this.#log = plugin.log.make(AttachmentsCache.name)
        this.#plugin = plugin
    }

    mayCache(remote: string, notepath: string, frontmatter?: unknown): boolean {
        return !!this.#findCache(remote, notepath, frontmatter, this.#log)
    }

    isCached(remote: string, notepath: string, frontmatter?: unknown): boolean {
        const filepath = this.resolve(remote, notepath, frontmatter)
        return !!filepath && !!this.#plugin.app.vault.getFileByPath(filepath)
    }

    resource(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): undefined | string {
        const filepath = this.resolve(remote, notepath, frontmatter)
        if (!filepath) return

        const file = this.#plugin.app.vault.getFileByPath(filepath)
        return file ? this.#plugin.app.vault.getResourcePath(file) : undefined
    }

    resolve(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): undefined | string {
        const group = this.#log.group()

        try {
            group.debug('Resolving', { remote, notepath, frontmatter })
            const filepath = this.#resolve(remote, notepath, frontmatter, group)
            if (filepath) {
                group.flush(`remote resolved <${remote}>`)
                return filepath
            }
        } catch (error) {
            group.error(error)
        }

        group.flush(`remote could not be resolved <${remote}>`)
        return
    }

    cache(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): undefined | string | Promise<undefined | string> {
        if (remote.startsWith('app')) return
        if (!remote.startsWith('http')) {
            this.#log.info(`remote(${remote}) should at least start with http`)
            return
        }

        const group = this.#log.group()
        try {
            group.debug('Caching', { remote, notepath, frontmatter })
            const filepath = this.#resolve(remote, notepath, frontmatter, group)
            if (!filepath) {
                group.debug('remote could not be resolved')
                group.flush(`remote was not cached <${remote}>`)
                return
            }

            // check existence
            const cachedFile = this.#plugin.app.vault.getFileByPath(filepath)
            if (cachedFile) {
                group.flush(`remote is already in cache <${remote}>`)
                return this.#plugin.app.vault.getResourcePath(cachedFile)
            }

            // download file
            return this.#cache(remote, filepath, group)
        } catch (error) {
            group.error(error)
        }

        group.flush(`remote could not be cached <${remote}>`)
        return
    }

    /** @throws {AttachmentError} */
    #resolve(
        remote: string,
        notepath: string,
        frontmatter: unknown,
        log: Logger,
    ): undefined | string {
        const baseUrl = URL.getBaseurl(remote)
        if (!baseUrl || !URI.hasExt(remote)) {
            log.debug('remote is not a valid URL')
            throw new AttachmentError('remote-no-url', `remote(${remote})`)
        }

        // faster resolution
        const cachedPath = this.#memo.get(baseUrl)
        if (cachedPath) {
            log.debug('remote resolved from cache', cachedPath)
            return cachedPath
        }

        // match cache rules
        const rule = this.#findCache(remote, notepath, frontmatter, log)
        if (!rule) {
            log.debug('a cache rule could not be matched')
            return
        }

        // ensure path normalization
        const filename = URI.getName(baseUrl)
        if (!filename) {
            log.warn(`a filename could not be identified from <${filename}>`)
            return
        }

        const filepath = resolveCachePath(rule.storage, notepath, filename)
        const localPath = !this.#plugin.state.allow_characters
            ? normalizePath(URI.normalize(filepath))
            : normalizePath(filepath)

        // save for faster resolution
        this.#memo.set(baseUrl, localPath)

        log.debug(`remote resolved <${localPath}>`)
        return localPath
    }

    /** Try to match the remote against the active cache rules. */
    #findCache(
        remote: string,
        notepath: string,
        frontmatter: unknown,
        log: Logger,
    ): CacheRule | undefined {
        log.debug('searching an active cache rule')
        const fm =
            typeof frontmatter === 'object'
                ? (frontmatter as Record<string, unknown>)
                : this.#plugin.app.metadataCache.getCache(notepath)?.frontmatter

        const rule = findCacheRule(this.#plugin.state, notepath, fm)
        if (!rule?.enabled) {
            log.debug('notepath does not match and active rule')
            return
        }

        // URL overrides
        if (testUrlParam(this.#plugin.state.url_param_ignore, remote)) {
            log.debug('remote has to be ignored (URL param)')
            return
        }
        if (testUrlParam(this.#plugin.state.url_param_cache, remote)) {
            log.debug('remote has to be cached (URL param)')
            return rule
        }

        // Frontmatter overrides
        if (testFmEntry(fm, this.#plugin.state.note_param_ignore, remote)) {
            log.debug('remote has to be ignored (Frontmatter attribute)')
            return
        }
        if (testFmEntry(fm, this.#plugin.state.note_param_cache, remote)) {
            log.debug('remote has to be cached (Frontmatter attribute)')
            return rule
        }

        // standard behavior
        if (testCacheRemote(rule.remote_patterns, remote)) {
            log.debug('remote has to be cached')
            return rule
        }
        log.debug('remote has to be ignored')
        return
    }

    /** @throws {AttachmentError} */
    async #cache(
        remote: string,
        filepath: string,
        group: LoggingGroup,
    ): Promise<undefined | string> {
        group.debug(`Downloading ${remote}`)
        try {
            const referer = URL.getOrigin(remote)
            const response = await requestUrl({
                url: remote + '?api',
                throw: false,
                method: 'GET',
                headers: { Referer: referer ? referer + '/' : '' },
            })
            AttachmentError.assertResponse(remote, response, 'url-request-get')

            group.debug(`Storing <${filepath}>`)
            const parentpath = URI.getParent(filepath) ?? '/'
            if (!this.#plugin.app.vault.getFolderByPath(parentpath)) {
                await this.#plugin.app.vault.createFolder(parentpath)
            }

            // prettier-ignore
            await this.#plugin.app.vault.createBinary(filepath, response.arrayBuffer)

            // check result
            const localFile = this.#plugin.app.vault.getFileByPath(filepath)
            if (localFile) {
                group.flush(`remote was cached <${remote}>`)
                return this.#plugin.app.vault.getResourcePath(localFile)
            }
        } catch (error) {
            group.error(error)
        }

        group.flush(`remote failed when caching <${remote}>`)
        return
    }
}
