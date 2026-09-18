import type { App, View } from 'obsidian'

export interface DetectedRemote {
    match: string
    offset: number
    remote: string
    label: string
}

/**
 * @example
 * const markdownAttach = '![optional-label](https://example.com/attachment.jpg)'
 * // or
 * const markdownLink = '[optional-label](https://example.com/attachment.jpg)'
 * // or
 * const plainUrl = 'https://example.com/attachment.jpg'
 */
export function detectRemotes(source: string): DetectedRemote[] {
    const detections: DetectedRemote[] = []
    // NOTE: maybe the regex could be improved??

    // may be faster a single regex
    // /!?\[([^\]]*)\]\([ \t]*(https?:\/\/[^)\s]+)[ \t]*\)/gi
    let replaced = source
    for (const md of replaced.matchAll(/!?\[([^\]]*)\]\(([^)\s]+)\)/gi)) {
        replaced = replaced.replace(md[0], ''.padEnd(md[0].length, '#'))

        // detect only urls
        const url = /https?:\/\/[^\s]+/gi.exec(md[2].trim())
        if (url) {
            detections.push({
                match: md[0],
                offset: md.index,
                remote: url[0],
                label: md[1],
            })
        }
    }

    // TODO: may settings be added to only match certain types of links
    // TODO: like match ![](https://...) and not https://...
    for (const url of replaced.matchAll(/https?:\/\/[^\s]+/gi)) {
        replaced = replaced.replace(url[0], ''.padEnd(url[0].length, '#'))
        detections.push({
            match: url[0],
            offset: url.index,
            remote: url[0],
            label: '',
        })
    }

    return detections
}

export async function findElementView(
    app: App,
    el: HTMLElement,
): Promise<View | undefined> {
    const search = () => {
        let foundView: View | undefined
        app.workspace.iterateAllLeaves((leaf) => {
            if (leaf.view.containerEl.contains(el)) foundView = leaf.view
        })
        return foundView
    }

    const view = search()
    if (view) return view

    // Timming issues on first render
    await new Promise((resolve) => requestAnimationFrame(resolve))
    return search()
}
