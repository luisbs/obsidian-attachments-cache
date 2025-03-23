// Idea taken from obsidian-dataview
import type { App } from 'obsidian'

/** Public API for third-party integration. */
export interface AttachmentsCacheApi {
    /** Test whether the attachments should be cached. */
    mayCache(remote: string, notepath: string, frontmatter?: unknown): boolean
    /** Test whether a remote file is already cached. */
    isCached(remote: string, notepath: string, frontmatter?: unknown): boolean
    /** Tries to map a remote url into a Vault resourcePath. */
    resource(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): undefined | string
    /** Tries to map a remote url into a Vault filePath. */
    resolve(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): undefined | string
    /**
     * Tries to cache a file localy and returns a Vault resourcePath.
     * @returns the Vault resourcePath or a Promise for it.
     */
    cache(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): undefined | string | Promise<undefined | string>
}

///////////////////////
// Utility Functions //
///////////////////////

/** Determine if Dataview is enabled in the given application. */
export const isPluginEnabled = (app: App) => {
    // @ts-expect-error non-standard API
    // eslint-disable-next-line
    app.plugins.enabledPlugins.has('attachments-cache')
}

/**
 * Get the current AttachmentsCache API from the app if provided;
 * otherwise it is inferred from the global API object installed
 * on the window.
 */
export const getAPI = (app?: App): AttachmentsCacheApi | undefined => {
    // @ts-expect-error non-standard API
    // eslint-disable-next-line
    if (app) return app.plugins.plugins['attachments-cache']?.api
    // @ts-expect-error non-standard API
    // eslint-disable-next-line
    return window.AttachmentsCache
}
