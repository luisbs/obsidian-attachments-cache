import type { AttachmentsCachePlugin } from '@/types'
import type {
    MarkdownPostProcessor,
    MarkdownPostProcessorContext,
} from 'obsidian'
import { setTimeout } from 'timers/promises'
import { PRIORITY } from '@/settings/values'

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
            this.#handle.bind(this),
            PRIORITY[this.plugin.settings.plugin_priority],
        )
    }

    async #handle(
        element: HTMLElement,
        { sourcePath }: MarkdownPostProcessorContext,
    ): Promise<void> {
        if (this.plugin.settings.plugin_priority === 'HIGHER') {
            // await 10s for plugins that use async PostProcessors
            await setTimeout(10000)
        } else if (this.plugin.settings.plugin_priority === 'NORMAL') {
            // await 2s for plugins that use async PostProcessors
            await setTimeout(2000)
        }

        for (const el of Array.from(element.querySelectorAll('img'))) {
            const resolved = await this.plugin.api.cache(sourcePath, el.src)
            if (resolved) el.src = resolved
        }

        // TODO: add support for other types of attachments
    }
}
