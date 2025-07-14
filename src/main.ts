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
                // static attachments can be archived
                this.#handleAttachments(element, (remote) => {
                    return this.#api.archive(remote, sourcePath, frontmatter)
                })

                // dynamic attachments from async or slow PostProcessors
                // can only be cached and require a defered execution
                if (!this.state.plugin_timeout) return
                setTimeout(() => {
                    this.#handleAttachments(element, (remote) => {
                        return this.#api.cache(remote, sourcePath, frontmatter)
                    })
                }, this.state.plugin_timeout)
            },
        )
    }

    #handleAttachments(
        element: HTMLElement,
        resolve: (remote: string) => Promise<string | undefined>,
    ): void {
        // TODO: add support for other types of attachments
        // other attachments to support: https://help.obsidian.md/file-formats

        element.querySelectorAll('img').forEach((el) => {
            // restrain Obsidian from downloading the original URL
            const [remote, title] = [el.src, el.title]
            el.title = 'Caching...'
            el.src = ''

            // wrapped download
            void resolve(remote).then((resourcepath) => {
                if (resourcepath) {
                    el.title = title || remote
                    el.src = resourcepath
                } else {
                    el.title = title
                    el.src = remote
                }
            })
        })
    }
}
