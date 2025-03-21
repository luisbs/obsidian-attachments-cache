import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import { Plugin, type App, type PluginManifest } from 'obsidian'
import { AttachmentsCacheApi } from './AttachmentsCacheAPI'
import { MarkdownHandler } from './filesystem/MarkdownHandler'
import { SettingsTab } from './settings/SettingsTab'
import { prepareCacheRules } from './utility/rules'
import {
    prepareSettings,
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

    public api: AttachmentsCacheApi
    public markdown: MarkdownHandler

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        // * always printing the first loadSettings()
        // * after that, the user-defined level is used
        this.log.setLevel(LogLevel.DEBUG)
        this.log.setFormat('[hh:mm:ss.ms] level:')

        this.api = new AttachmentsCacheApi(this)
        this.markdown = new MarkdownHandler(this)

        // thrid-party API
        // @ts-expect-error non-standard API
        window.AttachmentsCache = this.api
    }

    async onload(): Promise<void> {
        await this.loadSettings()
        this.addSettingTab(new SettingsTab(this))
        this.markdown.registerMarkdownProcessor()
    }

    onunload(): void {
        // @ts-expect-error non-standard API
        delete window.AttachmentsCache
    }

    async loadSettings(): Promise<void> {
        const group = this.log.group('Loading Settings')

        this.settings = await prepareSettings(this.loadData())
        group.debug('Loaded: ', this.settings)

        this.#prepareState(group)
        group.flush('Loaded Settings')
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

    #prepareState(log: Logger): void {
        log.info('Preparing state')

        // change Plugin behavior based on user input
        this.log.setLevel(LogLevel[this.settings.plugin_level])
        this.markdown.syncPriority()
        this.state = prepareState(this.settings)
    }
}
