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
        return !!this.#findCacheRule(remote, notepath, frontmatter, this.#log)
    }

    isArchivable(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): boolean {
        return !!this.#findCacheRule(remote, notepath, frontmatter, this.#log)
            ?.archive
    }

    async cache(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): Promise<string | undefined> {
        if (!remote.startsWith('http')) {
            this.#log.debug(`not an URL «${remote}»`)
            return
        }

        const group = this.#log.group()
        try {
            group.debug('Caching', { remote, notepath, frontmatter })
            const [localpath] = //
                this.#resolveLocalpath(remote, notepath, frontmatter, group)

            group.flush(`remote was cached «${remote}»`)
            return await this.#downloadAttachment(remote, localpath, group)
        } catch (error) {
            if (error instanceof AttachmentError) group.info(error)
            else group.warn(error)
        }

        group.flush(`remove could not be cached «${remote}»`)
        return
    }

    async archive(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): Promise<string | undefined> {
        if (!remote.startsWith('http')) {
            this.#log.info(`remote(${remote}) is not an URL`)
            return
        }

        const group = this.#log.group()
        try {
            group.debug('Archiving', { remote, notepath, frontmatter })
            const [localpath, rule] = //
                this.#resolveLocalpath(remote, notepath, frontmatter, group)
            const filepath = //
                await this.#downloadAttachment(remote, localpath, group)

            // only archive if the user wants that
            const cacherule = //
                rule ??
                this.#findCacheRule(remote, notepath, frontmatter, group)
            if (cacherule?.archive) {
                await this.#updateReferences(remote, notepath, localpath, group)
            }

            group.flush(`remote was archived «${remote}»`)
            return filepath
        } catch (error) {
            if (error instanceof AttachmentError) group.info(error)
            else group.warn(error)
        }

        group.flush(`remote could not be archived «${remote}»`)
        return
    }

    /** Try to match the remote against the active cache rules. */
    #findCacheRule(
        remote: string,
        notepath: string,
        frontmatter: unknown,
        log: Logger,
    ): CacheRule | undefined {
        log.debug('searching an active cache rule')
        const fm =
            typeof frontmatter === 'object'
                ? (frontmatter as FrontMatterCache)
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
        if (!testCacheRemote(rule.remote_patterns, remote)) {
            log.debug('remote has to be ignored')
            return
        }
        log.debug('remote has to be cached')
        return rule
    }

    /** @throws {AttachmentError} */
    #resolveLocalpath(
        remote: string,
        notepath: string,
        frontmatter: unknown,
        log: Logger,
    ): [string, CacheRule?] {
        // matches full URL including `#ids?and=params`
        const cachedPath1 = this.#memo.get(remote)
        if (cachedPath1) {
            log.debug(`resolved from cache «${cachedPath1}»`)
            return [cachedPath1]
        }

        const baseUrl = URL.getBaseurl(remote)
        if (!baseUrl || !URI.hasExt(remote))
            throw new AttachmentError('remote is not a valid URL')

        // matches base URL excluding anything after # or ?
        const cachedPath2 = this.#memo.get(baseUrl)
        if (cachedPath2) {
            log.debug(`resolved from cache «${cachedPath2}»`)
            return [cachedPath2]
        }

        const rule = this.#findCacheRule(remote, notepath, frontmatter, log)
        if (!rule) throw new AttachmentError('missing active cache rule')

        const filename = URI.getName(baseUrl)
        if (!filename) throw new AttachmentError('unidentifiable filename')

        // ensure path normalization
        const localpath = resolveCachePath(rule.storage, notepath, filename)
        const filepath = !this.#plugin.state.allow_characters
            ? normalizePath(URI.normalize(localpath))
            : normalizePath(localpath)

        // save for faster resolution
        this.#memo.set(baseUrl, filepath)
        this.#memo.set(remote, filepath)

        log.debug(`resolved «${filepath}»`)
        return [filepath, rule]
    }

    /** @throws {AttachmentError} */
    async #downloadAttachment(
        remote: string,
        filepath: string,
        log: LoggingGroup,
    ): Promise<string | undefined> {
        // check existence
        const cachedFile = this.#plugin.app.vault.getFileByPath(filepath)
        if (cachedFile) {
            log.debug(`remote was previously downloaded`)
            return this.#plugin.app.vault.getResourcePath(cachedFile)
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
        return this.#plugin.app.vault.getResourcePath(localFile)
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
