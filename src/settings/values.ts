import type { LogLevel } from '@luis.bs/obsidian-fnc'

//#region LogLevel
export type PluginLevel = keyof typeof LogLevel
export const LEVEL_LABELS: Record<PluginLevel, string> = {
    ERROR: 'ERROR',
    WARN: ' WARN',
    INFO: ' INFO',
    DEBUG: 'DEBUG',
    TRACE: 'TRACE',
}
//#endregion LogLevel

//#region Priorities
/** Utility type to map priority values. */
export type PluginPriority = 'LOWER' | 'NORMAL' | 'HIGHER'
/** Priority behavior: `higher = after` */
export const PRIORITY: Record<PluginPriority, number> = {
    // ! any value lower than 0 will ignore user-written elements
    /** Only caches user-written markdown. */
    LOWER: 0,
    /** Caches **PostProcessors** with default priority `0`. */
    NORMAL: 1,
    /** Only ignores the highest priority `Number.MAX_SAFE_INTEGER` */
    HIGHER: Number.MAX_SAFE_INTEGER - 1,
}
/** Labels for priority values */
export const PRIORITY_LABELS: Record<PluginPriority, string> = {
    LOWER: 'Only cache static attachments',
    NORMAL: 'Cache majority of attachments',
    HIGHER: 'Cache all posible attachments',
}
//#endregion Priorities

//#region Modes
/**
 * Mode to store the values:
 * - `'ROOT'` adds the attachments to the root of the vault
 * - `'PATH'` adds the attachments to a specified folder
 * - `'FILE'` adds the attachments to the same folder as the note
 * - `'FOLDER'` adds the attachments to a specified folder next to the note
 */
export type CacheMode = 'ROOT' | 'PATH' | 'FILE' | 'FOLDER'
interface ModeExampleDetails {
    mode: CacheMode
    target: string
}

export const MODE_LABELS: Record<CacheMode, string> = {
    ROOT: 'Vault folder',
    PATH: 'In the folder specified below',
    FILE: 'Same folder as current file',
    FOLDER: 'In subfolder under current folder',
}
export const MODE_DESC: Record<CacheMode, string> = {
    ROOT: 'Stores the attachments to the root of your vault',
    PATH: 'Stores the attachments to a specified folder',
    FILE: 'Stores the attachments to the same folder as the note',
    FOLDER: 'Stores the attachments to a specified folder next to the note',
}
export const modeExample = ({ mode, target }: ModeExampleDetails) => {
    // paths resolved from note: 'a/b/c/note1.md'
    // prettier-ignore
    switch (mode) {
        case 'ROOT': return 'img1.jpg'
        case 'FILE': return `a/b/c/img1.jpg`
        case 'FOLDER': return `a/b/c/${target}/img1.jpg`
    }

    // keep isolated from actual implementation
    const folder = target
        .replaceAll('{notepath}', 'a/b/c/note1')
        .replaceAll('{notename}', 'note1')
        .replaceAll('{folderpath}', 'a/b/c')
        .replaceAll('{foldername}', 'c')

    return `${folder}/img1.jpg`
}
//#endregion Modes
