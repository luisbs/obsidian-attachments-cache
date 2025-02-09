import type { AttachmentsCachePlugin } from '@/types'

export class MarkdownHandler {
    constructor(private plugin: AttachmentsCachePlugin) {}

    public registerMarkdownProcessor(): void {
        this.plugin.registerMarkdownPostProcessor(
            (element, ctx) => {
                element
                    .querySelectorAll('img')
                    .forEach((el) => void this.#image(el, ctx.sourcePath))
            },
            // TODO: test this parameter
            // /**
            //  * higher number affects after,
            //  * ensuring it affects the output of other processors
            //  */ 10000,
        )
    }

    async #image(el: HTMLImageElement, sourcePath: string): Promise<void> {
        const resolved = await this.plugin.api.cache(sourcePath, el.src)
        if (resolved) el.src = resolved
    }
}
