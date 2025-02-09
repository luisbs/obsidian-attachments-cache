import type {
    CacheMatcher,
    ImageCachingPlugin,
    ImageCachingPluginAPI,
} from '@/types'
import { Vault, normalizePath } from 'obsidian'
import { Logger, URI, URL } from '@luis.bs/obsidian-fnc'
import { getRemoteContent, getRemoteExt, ImageError } from './utility'

export class ImageCachingAPI implements ImageCachingPluginAPI {
    #log = Logger.consoleLogger(ImageCachingAPI.name)

    #plugin: ImageCachingPlugin
    #vault: Vault

    #memo = new Map<string, string | undefined>()

    constructor(plugin: ImageCachingPlugin) {
        this.#plugin = plugin
        this.#vault = plugin.app.vault
    }

    #findCache(notepath: string, remote: string): CacheMatcher | undefined {
        const matcher = this.#plugin.state.cache_matchers //
            .find((matcher) => matcher.testPath(notepath))

        // not-found or disabled paths
        if (!matcher?.isEnabled()) return

        // per-link overrides
        if (this.#plugin.state.url_ignore_matcher(remote)) return
        if (this.#plugin.state.url_cache_matcher(remote)) return matcher

        // standard behavior
        return matcher.testRemote(remote) ? matcher : undefined
    }

    mayCache(notepath: string, remote: string): boolean {
        return !!this.#findCache(notepath, remote)
    }

    async isCached(notepath: string, remote: string): Promise<boolean> {
        const resolved = await this.resolve(notepath, remote)
        return resolved ? await this.#vault.adapter.exists(resolved) : false
    }

    async resource(
        notepath: string,
        remote: string,
    ): Promise<string | undefined> {
        const resolved = await this.resolve(notepath, remote)
        if (!resolved) return

        const file = this.#vault.getFileByPath(resolved)
        return file ? this.#vault.getResourcePath(file) : undefined
    }

    async resolve(
        notepath: string,
        remote: string,
    ): Promise<string | undefined> {
        if (!URL.isUrl(remote)) {
            throw new ImageError('remote-no-url', `remote('${remote}')`)
        }

        const baseUrl = URL.getBaseurl(remote)
        if (!baseUrl) {
            throw new ImageError('remote-no-url', `remote('${remote}')`)
        }

        // faster resolution
        if (this.#memo.has(baseUrl)) return this.#memo.get(baseUrl)

        // identify behavior
        const matcher = this.#findCache(notepath, remote)
        if (!matcher) return

        // ensure normalization
        const name = URI.getBasename(baseUrl)
        const ext = URI.getExt(baseUrl) ?? (await getRemoteExt(remote))
        if (!name || !ext) throw new ImageError('remote-no-ext')

        const path = URI.join(matcher.resolve(notepath), name + '.' + ext)
        const res = !this.#plugin.settings.allow_characters
            ? normalizePath(URI.normalize(path))
            : normalizePath(path)

        // save for faster resolution
        this.#memo.set(baseUrl, res)
        return res
    }

    async cache(notepath: string, remote: string): Promise<string | undefined> {
        const log = this.#log.group(`Caching <${remote}>`)

        const resolved = await this.resolve(notepath, remote)
        if (!resolved) {
            log.flush('Caching avoided', { notepath, remote })
            return
        }
        log.debug(`Resolved <${resolved}>`, { notepath, remote })

        // check existence
        const file1 = this.#vault.getFileByPath(resolved)
        if (file1) {
            log.flush(`Already cached <${resolved}>`)
            return this.#vault.getResourcePath(file1)
        }

        // download file
        // log.warn({ resolved, mkdir: URI.getParent(resolved) })
        const content = await getRemoteContent(remote)
        await this.#vault.adapter.mkdir(URI.getParent(resolved))
        await this.#vault.adapter.writeBinary(resolved, content)

        // check result
        const file2 = this.#vault.getFileByPath(resolved)
        if (file2) {
            log.flush(`Freshly cached <${resolved}>`)
            return this.#vault.getResourcePath(file2)
        }

        log.flush(`Error caching <${resolved}>`)
        return
    }
}
