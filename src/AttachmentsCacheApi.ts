import { type Logger, type LoggingGroup, URI, URL } from '@luis.bs/obsidian-fnc'
import { type FrontMatterCache, normalizePath, requestUrl } from 'obsidian'
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

    isCacheable(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): boolean {
        const log = this.#log.group()
        try {
            log.debug('Cacheable check', { remote, notepath, frontmatter })
            const found = !!this.#findRule(remote, notepath, frontmatter, log)

            log.flush('CacheRule found', { remote, found })
            return found
        } catch (error) {
            if (error instanceof AttachmentError) log.info(error)
            else log.warn(error)

            log.flush('Cacheable check failed')
            return false
        }
    }

    isArchivable(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): boolean {
        const log = this.#log.group()
        try {
            log.debug('Archivable check', { remote, notepath, frontmatter })
            const found = !!this.#findRule(remote, notepath, frontmatter, log)
                .archive

            log.flush('CacheRule found', { remote, found })
            return found
        } catch (error) {
            if (error instanceof AttachmentError) log.info(error)
            else log.warn(error)

            log.flush('Archivable check failed')
            return false
        }
    }

    async cache(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): Promise<string | undefined> {
        const log = this.#log.group()
        try {
            log.debug('Caching', { remote, notepath, frontmatter })
            const rule = this.#findRule(remote, notepath, frontmatter, log)
            const localpath = this.#getLocalpath(remote, notepath, rule, log)
            await this.#downloadAttachment(remote, localpath, log)

            log.flush(`remote was cached «${remote}»`)
            return localpath
        } catch (error) {
            if (error instanceof AttachmentError) log.info(error)
            else log.warn(error)

            log.flush(`remote could not be cached «${remote}»`)
            return
        }
    }

    async archive(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): Promise<string | undefined> {
        const log = this.#log.group()
        try {
            log.debug('Archiving', { remote, notepath, frontmatter })
            const rule = this.#findRule(remote, notepath, frontmatter, log)
            const localpath = this.#getLocalpath(remote, notepath, rule, log)
            await this.#downloadAttachment(remote, localpath, log)

            // only update links if the user wants that
            if (rule.archive) {
                await this.#updateReferences(remote, notepath, localpath, log)
            }

            log.flush(`remote was archived «${remote}»`)
            return localpath
        } catch (error) {
            if (error instanceof AttachmentError) log.info(error)
            else log.warn(error)

            log.flush(`remote could not be archived «${remote}»`)
            return
        }
    }

    /** @throws {AttachmentError} */
    #findRule(
        remote: string,
        notepath: string,
        frontmatter: unknown,
        log: Logger,
    ): CacheRule {
        if (!remote.startsWith('http'))
            throw new AttachmentError(`not an URL «${remote}»`)

        log.debug('searching an active cache rule')
        const fm =
            typeof frontmatter === 'object'
                ? (frontmatter as FrontMatterCache)
                : this.#plugin.app.metadataCache.getCache(notepath)?.frontmatter

        const rule = findCacheRule(this.#plugin.state, notepath, fm)
        if (!rule?.enabled)
            throw new AttachmentError(`missing active rule «${notepath}»`)

        // URL overrides
        if (testUrlParam(this.#plugin.state.url_param_ignore, remote))
            throw new AttachmentError('ignore remote by URL param')
        if (testUrlParam(this.#plugin.state.url_param_cache, remote)) {
            log.debug('cache remote by URL param')
            return rule
        }

        // Frontmatter overrides
        if (testFmEntry(fm, this.#plugin.state.note_param_ignore, remote))
            throw new AttachmentError('ignore remote by Frontmatter attribute')
        if (testFmEntry(fm, this.#plugin.state.note_param_cache, remote)) {
            log.debug('cache remote by Frontmatter attribute')
            return rule
        }

        // standard behavior
        if (testCacheRemote(rule.remote_patterns, remote)) {
            log.debug('remote has to be cached')
            return rule
        }
        throw new AttachmentError('ignore remote')
    }

    /** @throws {AttachmentError} */
    #getLocalpath(
        remote: string,
        notepath: string,
        rule: CacheRule,
        log: Logger,
    ): string {
        // matches full URL including `#ids?and=params`
        const cachedPath1 = this.#memo.get(remote)
        if (cachedPath1) {
            log.debug(`resolved from cache «${cachedPath1}»`)
            return cachedPath1
        }

        const baseurl = URL.getBaseurl(remote)
        if (!baseurl || !URI.hasExt(remote))
            throw new AttachmentError('remote is not a valid URL')

        // matches base URL excluding anything after # or ?
        const cachedPath2 = this.#memo.get(baseurl)
        if (cachedPath2) {
            log.debug(`resolved from cache «${cachedPath2}»`)
            return cachedPath2
        }

        const filename = URI.getName(baseurl)
        if (!filename) throw new AttachmentError('unidentifiable filename')

        // ensure path normalization
        const localpath = resolveCachePath(rule.storage, notepath, filename)
        const filepath = !this.#plugin.state.allow_characters
            ? normalizePath(URI.normalize(localpath))
            : normalizePath(localpath)

        // save for faster resolution
        this.#memo.set(baseurl, filepath)
        this.#memo.set(remote, filepath)

        log.debug(`resolved «${filepath}»`)
        return filepath
    }

    /** @throws {AttachmentError} */
    async #downloadAttachment(
        remote: string,
        filepath: string,
        log: LoggingGroup,
    ): Promise<void> {
        // check existence
        const cachedFile = this.#plugin.app.vault.getFileByPath(filepath)
        if (cachedFile) {
            log.debug(`remote was previously downloaded`)
            return
        }

        log.debug(`downloading «${remote}»`)
        const referer = URL.getOrigin(remote)
        const response = await requestUrl({
            url: remote, //+ '?api',
            throw: false,
            method: 'GET',
            headers: { Referer: referer ? referer + '/' : '' },
        })
        if (response.status >= 400) {
            throw new AttachmentError(
                `requested url: ${remote}` +
                    `\nresponse status: ${response.status}` +
                    `\nresponse headers:\n${JSON.stringify(response.headers)}`,
            )
        }

        log.debug(`storing «${filepath}»`)
        const parentpath = URI.getParent(filepath) ?? '/'
        if (!this.#plugin.app.vault.getFolderByPath(parentpath)) {
            await this.#plugin.app.vault.createFolder(parentpath)
        }

        // prettier-ignore
        await this.#plugin.app.vault.createBinary(filepath, response.arrayBuffer)

        // check result
        const localFile = this.#plugin.app.vault.getFileByPath(filepath)
        if (!localFile) throw new AttachmentError('attachment download failed')

        log.debug(`remote was downloaded`)
        return
    }

    /** @throws {AttachmentError} */
    async #updateReferences(
        remote: string,
        notepath: string,
        filepath: string,
        log: LoggingGroup,
    ): Promise<void> {
        const noteFile = this.#plugin.app.vault.getFileByPath(notepath)
        if (!noteFile) throw new AttachmentError(`missing note «${notepath}»`)

        const url = remote.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
        const matcher = new RegExp(`!\\[([^\\]]*)\\]\\( *${url} *\\)`, 'g')

        // transform `![label](remote)` into `![[remote|label]]`
        log.debug('persisting local attachment')
        await this.#plugin.app.vault.process(noteFile, (content) => {
            return content.replaceAll(matcher, (_match, label, _index) => {
                return `![[${filepath}|${label}]]`
            })
        })
        log.debug('persisted local attachment')
    }
}
