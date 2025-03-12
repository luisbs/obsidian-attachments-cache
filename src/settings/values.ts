import { prepareHash } from '@/utility'
import type { LogLevel } from '@luis.bs/obsidian-fnc'

export function docs(
    name: string,
    desc: string | DocumentFragment,
): DocumentFragment {
    if (String.isString(desc)) {
        return createFragment((div) => {
            div.appendText(desc + '. Check the ')
            div.createEl('a', {
                text: 'Docs',
                href: `https://github.com/luisbs/obsidian-attachments-cache/blob/main/docs/settings.md#${prepareHash(name)}`,
            })
            div.appendText('.')
        })
    }

    desc.appendText('. Check the ')
    desc.createEl('a', {
        text: 'Docs',
        href: `https://github.com/luisbs/obsidian-attachments-cache/blob/main/docs/settings.md#${prepareHash(name)}`,
    })
    desc.appendText('.')
    return desc
}

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
