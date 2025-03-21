import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import {
    Plugin,
    type App,
    type MarkdownPostProcessor,
    type PluginManifest,
} from 'obsidian'
import { AttachmentsCacheApi } from './AttachmentsCacheApi'
import { AttachmentsCacheSettingsTab } from './settings/AttachmentsCacheSettingsTab'
import { prepareCacheRules } from './utility/rules'
import {
    prepareSettings,
    PRIORITY,
    type AttachmentsCacheSettings,
} from './utility/settings'
import { prepareState, type AttachmentsCacheState } from './utility/state'

// TODO: add an string `id` value
// TODO: change the code that uses `pattern` as an id
// TODO: sort CacheRules by `id` on settings UI
// TODO: add an input for the user to change the CacheRule `id`
// TODO: add an input for the user to change the CacheRule `pattern`
// TODO: add an toggle for the user to enable/disable the rule (as separated setting)
// TODO: change CacheConfig rendering behavior, when expanded replace header separated inputs
// TODO: add option to link a note to a CacheRule

export default class AttachmentsCachePlugin extends Plugin {
    public log = Logger.consoleLogger(AttachmentsCachePlugin.name)

    public settings = {} as AttachmentsCacheSettings
    public state = {} as AttachmentsCacheState

    #api: AttachmentsCacheApi
    #mpp?: MarkdownPostProcessor

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        // * always printing the first loadSettings()
        // * after that, the user-defined level is used
        this.log.setLevel(LogLevel.DEBUG)
        this.log.setFormat('[hh:mm:ss.ms] level:')

        this.#api = new AttachmentsCacheApi(this)

        // thrid-party API
        // @ts-expect-error non-standard API
        window.AttachmentsCache = this.#api
    }

    onunload(): void {
        // @ts-expect-error non-standard API
        delete window.AttachmentsCache
    }

    #prepareState(log: Logger): void {
        log.info('Preparing state')
        this.state = prepareState(this.settings)
        this.log.setLevel(LogLevel[this.settings.plugin_level])
        if (this.#mpp)
            this.#mpp.sortOrder = PRIORITY[this.settings.plugin_priority]
    }

    async saveSettings(): Promise<void> {
        const group = this.log.group('Saving Settings')
        const data = Object.assign({}, this.settings)

        // serialize special data types (Map, Set, etc)
        // ensure order of CacheRules and remotes
        data.cache_rules = prepareCacheRules(data.cache_rules)

        await this.saveData(data)
        group.debug('Saved: ', data)

        this.#prepareState(group)
        group.flush('Saved Settings')
    }

    async onload(): Promise<void> {
        const group = this.log.group('Loading AttachmentsCache')

        this.settings = await prepareSettings(this.loadData())
        group.debug('Loaded: ', this.settings)

        this.addSettingTab(new AttachmentsCacheSettingsTab(this))
        this.#registerMarkdownProcessor()
        this.#prepareState(group)

        group.flush('Loaded AttachmentsCache')
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
            (element, { sourcePath }) => {
                // imidiate execution
                if (this.settings.plugin_priority === 'LOWER') {
                    void this.#handle(element, sourcePath)
                    return
                }

                // for plugins that use async PostProcessors await some seconds
                const millis =
                    this.settings.plugin_priority === 'HIGHER' ? 10000 : 2000
                setTimeout(() => void this.#handle(element, sourcePath), millis)
            },
        )
    }

    async #handle(element: HTMLElement, sourcePath: string): Promise<void> {
        for (const el of Array.from(element.querySelectorAll('img'))) {
            const resolved = await this.#api.cache(sourcePath, el.src)
            if (resolved) el.src = resolved
        }

        // TODO: add support for other types of attachments
        // other attachments to support: https://help.obsidian.md/file-formats
    }
}
