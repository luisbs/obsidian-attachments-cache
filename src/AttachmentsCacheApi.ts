import { type Logger, URI, URL } from '@luis.bs/obsidian-fnc'
import { type App, normalizePath, requestUrl } from 'obsidian'
import type AttachmentsCachePlugin from './main'
import { AttachmentError } from './utility/AttachmentError'
import { type RuleMatcher } from './utility/state'
import { getMimeExt } from './utility/strings'

interface RemoteDef {
    notepath: string
    remote: string
}

export class AttachmentsCacheApi implements AttachmentsCacheApi {
    #log: Logger
    #app: App
    #plugin: AttachmentsCachePlugin

    #memo = new Map<string, string | undefined>()

    constructor(plugin: AttachmentsCachePlugin) {
        this.#log = plugin.log.make(AttachmentsCacheApi.name)
        this.#app = plugin.app
        this.#plugin = plugin
    }

    mayCache(notepath: string, remote: string): boolean {
        return !!this.#findCacheRule({ notepath, remote }, this.#log)
    }

    async isCached(notepath: string, remote: string): Promise<boolean> {
        const localPath = await this.resolve(notepath, remote)
        return !!localPath && !!this.#app.vault.getAbstractFileByPath(localPath)
    }

    async resource(
        notepath: string,
        remote: string,
    ): Promise<string | undefined> {
        const localPath = await this.resolve(notepath, remote)
        if (!localPath) return

        const file = this.#app.vault.getFileByPath(localPath)
        return file ? this.#app.vault.getResourcePath(file) : undefined
    }

    async resolve(
        notepath: string,
        remote: string,
    ): Promise<string | undefined> {
        const group = this.#log.group()

        try {
            group.debug('Resolving', { notepath, remote })
            const localPath = await this.#resolve({ notepath, remote }, group)
            if (localPath) {
                group.flush('remote resolved', remote)
                return localPath
            }
        } catch (error) {
            group.error(error)
        }

        group.flush('remote could not be resolved', remote)
        return
    }

    async cache(notepath: string, remote: string): Promise<string | undefined> {
        if (!remote.startsWith('http')) {
            this.#log.debug('remotes should at least start with http')
            return remote
        }

        const group = this.#log.group()
        try {
            group.debug('Caching', { notepath, remote })
            const localPath = await this.#resolve({ notepath, remote }, group)
            if (!localPath) {
                group.debug('remote could not be resolved')
                group.flush('remote was not cached', remote)
                return
            }

            // check existence
            const cachedFile = this.#app.vault.getFileByPath(localPath)
            if (cachedFile) {
                group.flush('remote is already in cache', remote)
                return this.#app.vault.getResourcePath(cachedFile)
            }

            // download file
            const content = await this.#getRemoteContent(remote, group)
            const parentpath = URI.getParent(localPath) ?? '/'
            if (!this.#app.vault.getFolderByPath(parentpath)) {
                // createBinary fails if parent dir is missing
                await this.#app.vault.createFolder(parentpath)
            }
            await this.#app.vault.createBinary(localPath, content)

            // check result
            const downloadedFile = this.#app.vault.getFileByPath(localPath)
            if (downloadedFile) {
                group.flush('remote was cached', remote)
                return this.#app.vault.getResourcePath(downloadedFile)
            }
        } catch (error) {
            group.error(error)
        }

        group.flush('remote could not be cached', remote)
        return
    }

    #findCacheRule(v: RemoteDef, log: Logger): RuleMatcher | undefined {
        log.debug('searching an active cache rule')
        const matcher = this.#plugin.state.cache_matchers //
            .find((matcher) => matcher.testPath(v.notepath))

        // not-found or disabled paths
        if (!matcher?.isEnabled()) {
            log.debug('notepath does not match and active rule')
            return
        }

        // URL overrides
        if (this.#plugin.state.url_ignore_matcher(v.remote)) {
            log.debug('remote has to be ignored (URL param)')
            return
        }
        if (this.#plugin.state.url_cache_matcher(v.remote)) {
            log.debug('remote has to be cached (URL param)')
            return matcher
        }

        // Frontmatter overrides
        if (
            this.#plugin.state.note_ignore_matcher(
                this.#app,
                v.notepath,
                v.remote,
            )
        ) {
            log.debug('remote has to be ignored (Frontmatter attribute)')
            return
        }
        if (
            this.#plugin.state.note_cache_matcher(
                this.#app,
                v.notepath,
                v.remote,
            )
        ) {
            log.debug('remote has to be cached (Frontmatter attribute)')
            return matcher
        }

        // standard behavior
        if (matcher.testRemote(v.remote)) {
            log.debug('remote matches an active rule')
            return matcher
        }

        log.debug('remote does not match and active rule')
        return undefined
    }

    /** @throws {AttachmentError} */
    async #resolve(v: RemoteDef, log: Logger): Promise<string | undefined> {
        const baseUrl = URL.getBaseurl(v.remote)
        if (!baseUrl) {
            log.debug('remote is not a valid URL')
            throw new AttachmentError('remote-no-url', `remote(${v.remote})`)
        }

        // faster resolution
        const cachedPath = this.#memo.get(baseUrl)
        if (cachedPath) {
            log.debug('remote resolved from cache', cachedPath)
            return cachedPath
        }

        // identify behavior
        const matcher = this.#findCacheRule(v, log)
        if (!matcher) {
            log.debug('a cache rule could not be matched')
            return
        }

        // ensure normalization
        const name = URI.getBasename(baseUrl)
        const ext =
            URI.getExt(baseUrl) ?? (await this.#getRemoteExt(v.remote, log))
        if (!name || !ext) {
            log.debug(`name(${name}) or ext(${ext}) could not be resolved`)
            throw new AttachmentError('remote-no-ext')
        }

        const filepath = URI.join(matcher.resolve(v.notepath), name + '.' + ext)
        const localPath = !this.#plugin.settings.allow_characters
            ? normalizePath(URI.normalize(filepath))
            : normalizePath(filepath)

        // save for faster resolution
        this.#memo.set(baseUrl, localPath)

        log.debug('remote resolved', localPath)
        return localPath
    }

    /**
     * Request the metadata of a file, to determine the file extension.
     * @throws {AttachmentError}
     */
    async #getRemoteExt(url: string, log: Logger): Promise<string> {
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
    async #getRemoteContent(url: string, log: Logger): Promise<ArrayBuffer> {
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
}
