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
 * - `'NOTE'` alongside the note. (doesn't use target)
 * - `'NOTE-FOLDER'` alongside the note in a subfolder with the target as name.
 * - `'TARGET'` directly inside target path.
 * - `'TARGET-NOTE'` inside target path in a subfolder with the note-name.
 * - `'TARGET-PATH'` inside target path replicating note-path
 */
export type CacheMode =
    | 'NOTE'
    | 'NOTE-FOLDER'
    | 'TARGET'
    | 'TARGET-NOTE'
    | 'TARGET-PATH'
interface ModeExampleDetails {
    mode: CacheMode
    target: string
}

export const MODE_LABELS: Record<CacheMode, string> = {
    NOTE: /*    */ 'Attachments next to the note',
    'NOTE-FOLDER': 'Attachments on subfolder',
    TARGET: /*  */ 'Attachments on cache folder',
    'TARGET-NOTE': 'Attachments on cache note folder',
    'TARGET-PATH': 'Attachments on cache note path',
}
export const MODE_DESC: Record<CacheMode, string> = {
    NOTE: /*    */ 'Store in the same folder as the note',
    'NOTE-FOLDER': 'Store next to the note in subfolder',
    TARGET: /*  */ 'Store in folder',
    'TARGET-NOTE': 'Store in subfolder with the note-name under',
    'TARGET-PATH': 'Store in a replated note-path under',
}
export const modeExample = ({ mode, target }: ModeExampleDetails) => {
    // prettier-ignore
    switch (mode) {
        case 'NOTE': /*  */ return 'folder/img1.jpg'
        case 'NOTE-FOLDER': return `folder/${target}/img1.jpg`
        case 'TARGET': /**/ return `${target}/img1.jpg`
        case 'TARGET-NOTE': return `${target}/note1/img1.jpg`
        case 'TARGET-PATH': return `${target}/folder/note1/img1.jpg`
    }
}
//#endregion Modes
