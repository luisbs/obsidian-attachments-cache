import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import {
    Plugin,
    type App,
    type MarkdownPostProcessor,
    type PluginManifest,
} from 'obsidian'
import { AttachmentsCache } from './AttachmentsCacheApi'
import {
    prepareSettings,
    type AttachmentsCacheSettings,
} from './commons/PluginSettings'
import { prepareState, type AttachmentsCacheState } from './commons/PluginState'
import type { AttachmentsCacheApi } from './lib'
import { PluginSettingTab } from './settings/PluginSettingTab'

export default class AttachmentsCachePlugin extends Plugin {
    log = Logger.consoleLogger(AttachmentsCachePlugin.name)
    settings = {} as AttachmentsCacheSettings
    state = {} as AttachmentsCacheState

    #api: AttachmentsCacheApi
    #mpp?: MarkdownPostProcessor

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        // * always printing the first loadSettings()
        // * after that, the user-defined level is used
        this.log.setLevel(LogLevel.DEBUG)
        this.log.setFormat('[hh:mm:ss.ms] level:')

        // thrid-party API
        this.#api = new AttachmentsCache(this)
        // @ts-expect-error non-standard API
        window.AttachmentsCache = this.#api
    }

    onunload(): void {
        // @ts-expect-error non-standard API
        delete window.AttachmentsCache
    }

    async onload(): Promise<void> {
        const group = this.log.group('Loading AttachmentsCache')

        this.settings = prepareSettings(await this.loadData())
        group.debug('Loaded: ', this.settings)

        this.addSettingTab(new PluginSettingTab(this))

        this.#prepareState(group)
        this.#registerMarkdownProcessor()
        group.flush('Loaded AttachmentsCache')
    }

    async saveSettings(): Promise<void> {
        const group = this.log.group('Saving AttachmentsCache settings')

        await this.saveData(this.settings)
        group.debug('Saved: ', this.settings)

        this.#prepareState(group)
        group.flush('Saved AttachmentsCache settings')
    }

    #prepareState(log: Logger): void {
        log.info('Preparing AttachmentsCache state')
        this.state = prepareState(this.settings)

        this.log.setLevel(this.state.plugin_level)
        if (this.#mpp) this.#mpp.sortOrder = this.state.plugin_priority
    }

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
    #registerMarkdownProcessor(): void {
        this.#mpp = this.registerMarkdownPostProcessor(
            (element, { sourcePath, frontmatter }) => {
                // inmediate execution for static attachments
                // avoid the creation of 2 requests for them
                this.#handleCache(element, sourcePath, frontmatter)

                // defers a second execution, with a timeout to
                // allow async or slow PostProcessors to render extra content
                if (this.state.plugin_timeout) {
                    setTimeout(() => {
                        this.#handleCache(element, sourcePath, frontmatter)
                    }, this.state.plugin_timeout)
                }
            },
        )
    }

    #handleCache(
        element: HTMLElement,
        notepath: string,
        frontmatter: unknown,
    ): void {
        for (const el of Array.from(element.querySelectorAll('img'))) {
            const resolved = this.#api.cache(el.src, notepath, frontmatter)
            // when `result = undefined` keep the original URL
            if (!resolved) continue

            // when `result is string` the attachment it's already cached
            if (String.isString(resolved)) {
                el.src = resolved
                continue
            }

            // otherwise the image is been downloaded, so
            // restrain Obsidian from downloading the original URL
            const source = [el.src, el.title]
            el.title = 'Caching...'
            el.src = ''

            // when the download is completed
            void resolved.then((resourcepath) => {
                if (resourcepath) {
                    // when the download succeded, use the local URL
                    el.src = resourcepath
                    el.title = source[1] ?? source[0]
                } else {
                    // otherwise restore the original URL
                    el.src = source[0]
                    el.title = source[1]
                }
            })
        }

        // TODO: add support for other types of attachments
        // other attachments to support: https://help.obsidian.md/file-formats
    }
}
