import type { PluginSettings, PluginState } from '@/types'
import { App, Plugin, PluginManifest } from 'obsidian'
import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import { prepareConfigs, prepareState } from './utility'
import { SettingsTab } from './settings/SettingsTab'
import { MarkdownHandler } from './filesystem/MarkdownHandler'
import { AttachmentsCacheAPI } from './AttachmentsCacheAPI'

const DEFAULT_SETTINGS: PluginSettings = {
    // * 'WARN' level to force the user to choose a lower level when is required
    // * this decition, prevents the console from been overpopulated by default
    plugin_level: 'WARN',
    // * 'NORMAL' priority to cache user-written markdown
    // * and PostProcessors with default priority
    plugin_priority: 'NORMAL',
    //
    allow_characters: false,
    url_param_cache: 'cache_file',
    url_param_ignore: 'ignore_file',
    note_param_cache: 'cache_from',
    note_param_ignore: 'cache_unless',
    cache_configs: [
        {
            pattern: '*',
            remotes: [{ whitelisted: false, pattern: '*' }],
            enabled: false,
            target: '',
            mode: 'ROOT',
        },
    ],
}

export default class AttachmentsCachePlugin extends Plugin {
    public log = Logger.consoleLogger(AttachmentsCachePlugin.name)

    public settings = {} as PluginSettings
    public state = {} as PluginState

    public api: AttachmentsCacheAPI
    public markdown: MarkdownHandler

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        // * always printing the first loadSettings()
        // * after that, the user-defined level is used
        this.log.setLevel(LogLevel.DEBUG)
        this.log.setFormat('[hh:mm:ss.ms] level:')

        this.api = new AttachmentsCacheAPI(this)
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
        const { cache_configs, ...primitives } = ((await this.loadData()) ??
            {}) as Partial<PluginSettings>

        // ensure a fallback value is present
        // ensure order of configs and remotes
        this.settings = Object.assign({}, DEFAULT_SETTINGS, primitives)
        this.settings.cache_configs = prepareConfigs([
            ...(cache_configs ?? []),
            ...DEFAULT_SETTINGS.cache_configs,
        ])

        group.debug('Loaded: ', this.settings)

        this.#prepareState(group)
        group.flush('Loaded Settings')
    }

    async saveSettings(): Promise<void> {
        const group = this.log.group('Saving Settings')
        const data = Object.assign({}, this.settings)

        // serialize special data types (Map, Set, etc)
        // ensure order of configs and remotes
        data.cache_configs = prepareConfigs(data.cache_configs)

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
        this.state = prepareState(this)
    }
}
