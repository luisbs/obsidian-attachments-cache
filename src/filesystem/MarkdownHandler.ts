import type { AttachmentsCachePlugin } from '@/types'
import type {
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
} from 'obsidian'
import { PRIORITY } from '@/settings/values'

export class MarkdownHandler {
    constructor(private plugin: AttachmentsCachePlugin) {}

    #mpp?: MarkdownPostProcessor

    /**
     * Priorities sorts the **PostProcesors** order of execution, `higher = after`.
     *
     * When a **PostProcesors** runs after the cache **PostProcesor**,
     * any attachment generated will not be detected.
     *
     * For context on priority of other plugins:
     * * luisbs/obsidian-components: `-100`
     * * blacksmithgu/obsidian-dataview: `-100`
     *
     * @default `99` caches attachments of normal PostProcesors (`priority = 0`)
     */
    public syncPriority(): void {
        if (!this.#mpp) return
        this.#mpp.sortOrder = PRIORITY[this.plugin.settings.plugin_priority]
    }

    public registerMarkdownProcessor(): void {
        this.#mpp = this.plugin.registerMarkdownPostProcessor(
            this.#handle.bind(this),
            PRIORITY[this.plugin.settings.plugin_priority],
        )
    }

    async #handle(
        element: HTMLElement,
        { sourcePath }: MarkdownPostProcessorContext,
    ): Promise<void> {
        for (const el of Array.from(element.querySelectorAll('img'))) {
            const resolved = await this.plugin.api.cache(sourcePath, el.src)
            if (resolved) el.src = resolved
        }

        // TODO: add support for other types of attachments
    }
}
