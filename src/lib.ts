// Idea taken from obsidian-dataview
import type { App } from 'obsidian'

/** Public API for third-party integration. */
export interface AttachmentsCacheApi {
    /** Determine whether the attachment matches a **short-term** storage rule. */
    isCacheable(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): boolean
    /** Download the attachment and provide a resourcePath. */
    cache(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): Promise<string | undefined>

    /** Determine whether the attachment matches a **long-term** storage rule. */
    isArchivable(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): boolean
    /**
     * Download the attachment and update the reference on the note.
     * @returns a resourcePath if the attachment is cacheable but not archivable.
     */
    archive(
        remote: string,
        notepath: string,
        frontmatter?: unknown,
    ): Promise<string | undefined>
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
