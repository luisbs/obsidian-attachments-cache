// Idea taken from obsidian-dataview
import type { App } from 'obsidian'
import type { AttachmentsCacheAPI } from './AttachmentsCacheAPI'

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
export const getAPI = (app?: App): AttachmentsCacheAPI | undefined => {
    // @ts-expect-error non-standard API
    // eslint-disable-next-line
    if (app) return app.plugins.plugins['attachments-cache']?.api
    // @ts-expect-error non-standard API
    else return window.AttachmentsCache as AttachmentsCacheAPI
}
