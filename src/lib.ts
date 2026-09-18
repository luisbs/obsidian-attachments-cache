import type { App } from 'obsidian';
import type { AttachmentsCacheApi } from './AttachmentsCacheApi';

declare module "obsidian" {
    interface App {
        plugins: {
            enabledPlugins: Set<string>;
            plugins: {
                ['attachments-cache']?: {
                    api: AttachmentsCacheApi;
                };
            };
        };
    }
}

declare global {
    interface Window {
        AttachmentsCacheAPI?: AttachmentsCacheApi;
    }
}

///////////////////////////////////////
//         Utility Functions         //
// Idea taken from obsidian-dataview //
///////////////////////////////////////

/** Determine if AttachmentsCache is enabled in the given application. */
export const isPluginEnabled = (app: App) => app.plugins.enabledPlugins.has('attachments-cache')

/**
 * Get the current AttachmentsCache API from the app if provided;
 * otherwise it is inferred from the global API object installed
 * on the window.
 */
export const getAPI = (app?: App): AttachmentsCacheApi | undefined => {
    if (app) return app.plugins.plugins['attachments-cache']?.api
    return window.AttachmentsCacheAPI
}
