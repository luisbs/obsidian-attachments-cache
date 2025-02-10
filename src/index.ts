// Idea taken from obsidian-dataview
import type { App } from 'obsidian'

/** Public API for third-party integration. */
export interface AttachmentsCachePluginAPI {
    /** Test whether the attachments should be cached. */
    mayCache(notepath: string, remote: string): boolean
    /** Test whether a remote file is already cached. */
    isCached(notepath: string, remote: string): Promise<boolean>
    /** Tries to map a remote url into a Vault resourcePath. */
    resource(notepath: string, remote: string): Promise<string | undefined>
    /** Tries to map a remote url into a Vault filePath. */
    resolve(notepath: string, remote: string): Promise<string | undefined>
    /** Tries to cache a file locally and returns a Vault resourcePath. */
    cache(notepath: string, remote: string): Promise<string | undefined>
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
export const getAPI = (app?: App): AttachmentsCachePluginAPI | undefined => {
    // @ts-expect-error non-standard API
    // eslint-disable-next-line
    if (app) return app.plugins.plugins['attachments-cache']?.api
    // @ts-expect-error non-standard API
    // eslint-disable-next-line
    return window.AttachmentsCache
}
