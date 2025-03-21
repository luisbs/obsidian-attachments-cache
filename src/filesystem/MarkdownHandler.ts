import type AttachmentsCachePlugin from '@/main'
import { PRIORITY } from '@/utility/settings'
import type { MarkdownPostProcessor } from 'obsidian'

export class MarkdownHandler {
    constructor(private plugin: AttachmentsCachePlugin) {}

    #mpp?: MarkdownPostProcessor

    /**
     * Priorities sorts the **PostProcesors** order of execution, `higher == after`.
     * When **PostProcesors** use an `async` function, it is not awaited
     * so the sortOrder is not enforced.
     *
     * When a **PostProcesors** runs after the cache **PostProcesor**,
     * any attachment generated will not be detected.
     *
     * For context on priority of other plugins:
     * * luisbs/obsidian-components: `-100`
     * * blacksmithgu/obsidian-dataview: `-100`
     *
     * @default `1` caches attachments of normal PostProcesors (`priority = 0`)
     */
    public syncPriority(): void {
        if (!this.#mpp) return
        this.#mpp.sortOrder = PRIORITY[this.plugin.settings.plugin_priority]
    }

    public registerMarkdownProcessor(): void {
        this.#mpp = this.plugin.registerMarkdownPostProcessor(
            (element, { sourcePath }) => {
                // imidiate execution
                if (this.plugin.settings.plugin_priority === 'LOWER') {
                    void this.#handle(element, sourcePath)
                    return
                }

                // for plugins that use async PostProcessors await some seconds
                const millis =
                    this.plugin.settings.plugin_priority === 'HIGHER'
                        ? 10000
                        : 2000
                setTimeout(() => void this.#handle(element, sourcePath), millis)
            },
        )
        this.syncPriority()
    }

    async #handle(element: HTMLElement, sourcePath: string): Promise<void> {
        for (const el of Array.from(element.querySelectorAll('img'))) {
            const resolved = await this.plugin.api.cache(sourcePath, el.src)
            if (resolved) el.src = resolved
        }

        // TODO: add support for other types of attachments
        // other attachments to support: https://help.obsidian.md/file-formats
    }
}
