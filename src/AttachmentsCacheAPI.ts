import type {
    AttachmentsCachePlugin,
    AttachmentsCachePluginAPI,
    CacheMatcher,
} from '@/types'
import { Vault, normalizePath } from 'obsidian'
import { Logger, URI, URL } from '@luis.bs/obsidian-fnc'
import { getRemoteContent, getRemoteExt, AttachmentError } from './utility'

interface RemoteDef {
    notepath: string
    remote: string
}

export class AttachmentsCacheAPI implements AttachmentsCachePluginAPI {
    public log: Logger

    #vault: Vault
    #plugin: AttachmentsCachePlugin

    #memo = new Map<string, string | undefined>()

    constructor(plugin: AttachmentsCachePlugin) {
        this.log = plugin.log.make(AttachmentsCacheAPI.name)
        this.#vault = plugin.app.vault
        this.#plugin = plugin
    }

    mayCache(notepath: string, remote: string): boolean {
        return !!this.#findCacheRule({ notepath, remote }, this.log)
    }

    async isCached(notepath: string, remote: string): Promise<boolean> {
        const localPath = await this.resolve(notepath, remote)
        return localPath ? await this.#vault.adapter.exists(localPath) : false
    }

    async resource(
        notepath: string,
        remote: string,
    ): Promise<string | undefined> {
        const localPath = await this.resolve(notepath, remote)
        if (!localPath) return

        const file = this.#vault.getFileByPath(localPath)
        return file ? this.#vault.getResourcePath(file) : undefined
    }

    async resolve(
        notepath: string,
        remote: string,
    ): Promise<string | undefined> {
        const group = this.log.group()

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
        const group = this.log.group()

        try {
            group.debug('Caching', { notepath, remote })
            const localPath = await this.#resolve({ notepath, remote }, group)
            if (!localPath) {
                group.debug('remote could not be resolved')
                group.flush('remote was not cached', remote)
                return
            }

            // check existence
            const cachedFile = this.#vault.getFileByPath(localPath)
            if (cachedFile) {
                group.flush('remote is already in cache', remote)
                return this.#vault.getResourcePath(cachedFile)
            }

            // download file
            const content = await getRemoteContent(remote, group)
            await this.#vault.adapter.mkdir(URI.getParent(localPath))
            await this.#vault.adapter.writeBinary(localPath, content)

            // check result
            const downloadedFile = this.#vault.getFileByPath(localPath)
            if (downloadedFile) {
                group.flush('remote was cached', remote)
                return this.#vault.getResourcePath(downloadedFile)
            }
        } catch (error) {
            group.error(error)
        }

        group.flush('remote could not be cached', remote)
        return
    }

    #findCacheRule(v: RemoteDef, log?: Logger): CacheMatcher | undefined {
        log?.debug('searching an active cache rule')
        const matcher = this.#plugin.state.cache_matchers //
            .find((matcher) => matcher.testPath(v.notepath))

        // not-found or disabled paths
        if (!matcher?.isEnabled()) {
            log?.debug('notepath does not match and active rule')
            return
        }

        // per-link overrides
        if (this.#plugin.state.url_ignore_matcher(v.remote)) {
            log?.debug('remote is marked to be ignored')
            return
        }
        if (this.#plugin.state.url_cache_matcher(v.remote)) {
            log?.debug('remote is marked to be cached')
            return matcher
        }

        // standard behavior
        if (matcher.testRemote(v.remote)) {
            log?.debug('remote matches an active rule')
            return matcher
        }

        log?.debug('remote does not match and active rule')
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
        const ext = URI.getExt(baseUrl) ?? (await getRemoteExt(v.remote, log))
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
}
