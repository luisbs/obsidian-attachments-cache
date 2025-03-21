import type { PluginLevel, PluginPriority } from '@/utility/settings'

export const LEVEL_LABELS: Record<PluginLevel, string> = {
    ERROR: 'ERROR',
    WARN: ' WARN',
    INFO: ' INFO',
    DEBUG: 'DEBUG',
    TRACE: 'TRACE',
}

export const PRIORITY_LABELS: Record<PluginPriority, string> = {
    LOWER: 'Only cache static attachments',
    NORMAL: 'Cache majority of attachments',
    HIGHER: 'Cache all posible attachments',
}

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

function prepareHash(source: string): string {
    return source
        .replaceAll(' ', '-')
        .replaceAll(/[^\w-]/gi, '')
        .toLowerCase()
}
