import type { PluginSettings, PluginState } from './types'
import { App, Plugin, PluginManifest } from 'obsidian'
import { Logger } from '@luis.bs/obsidian-fnc'
import {
    prepareConfigs,
    prepareConfigMatchers,
    prepareRemoteMatcher,
} from './utility'
import { SettingsTab } from './settings/SettingsTab'
import { MarkdownHandler } from './filesystem/MarkdownHandler'
import { AttachmentsCacheAPI } from './AttachmentsCacheAPI'

const DEFAULT_SETTINGS: PluginSettings = {
    allow_characters: false,
    url_param_cache: 'cache_file',
    url_param_ignore: 'ignore_file',
    cache_configs: [
        {
            pattern: '*',
            remotes: [{ whitelisted: false, pattern: '*' }],
            enabled: false,
            target: '',
            mode: 'NOTE',
        },
    ],
}

export class AttachmentsCachePlugin extends Plugin {
    #log = Logger.consoleLogger(AttachmentsCachePlugin.name)

    public settings = {} as PluginSettings
    public state = {} as PluginState

    public api: AttachmentsCacheAPI
    public markdown: MarkdownHandler

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        this.api = new AttachmentsCacheAPI(this)
        this.markdown = new MarkdownHandler(this)

        // thrid-party API
        // @ts-expect-error non-standard API
        globalThis.AttachmentsCache = this.api
    }

    async onload(): Promise<void> {
        await this.loadSettings()
        this.addSettingTab(new SettingsTab(this))

        this.markdown.registerMarkdownProcessor()
    }

    // async onunload(): Promise<void> {
    //     // TODO
    // }

    async loadSettings(): Promise<void> {
        const log = this.#log.group('Loading Settings')
        const { cache_configs, ...primitives } = ((await this.loadData()) ||
            {}) as Partial<PluginSettings>

        // ensure a fallback value is present
        // ensure order of configs and remotes
        this.settings = Object.assign({}, DEFAULT_SETTINGS, primitives)
        this.settings.cache_configs = prepareConfigs([
            ...(cache_configs ?? []),
            ...DEFAULT_SETTINGS.cache_configs,
        ])

        log.debug('Loaded: ', this.settings)
        log.flush('Loaded Settings')

        this.#prepareState()
    }

    async saveSettings(): Promise<void> {
        const log = this.#log.group('Saving Settings')
        const data = Object.assign({}, this.settings)

        // serialize special data types (Map, Set, etc)
        // ensure order of configs and remotes
        data.cache_configs = prepareConfigs(data.cache_configs)

        await this.saveData(data)
        log.debug('Saved: ', data)
        log.flush('Saved Settings')

        this.#prepareState()
    }

    #prepareState(): void {
        this.#log.info('Prepare state')
        this.state = {
            cache_matchers: prepareConfigMatchers(this.settings.cache_configs),
            url_cache_matcher: prepareRemoteMatcher(
                this.settings.url_param_cache,
            ),
            url_ignore_matcher: prepareRemoteMatcher(
                this.settings.url_param_ignore,
            ),
        }
    }
}
