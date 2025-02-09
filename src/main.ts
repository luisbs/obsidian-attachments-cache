import type { PluginSettings, PluginState } from './types'
import { App, Plugin, PluginManifest } from 'obsidian'
import { Logger } from 'obsidian-fnc'
import { prepareConfigs, prepareConfigMatchers, prepareRemoteMatcher } from './utility'
import { SettingsTab } from './settings/SettingsTab'
import { MarkdownHandler } from './filesystem/MarkdownHandler'
import { ImageCachingAPI } from './ImageCachingAPI'

export const DEFAULT_SETTINGS: PluginSettings = {
  allow_characters: false,
  url_param_cache: 'cache_image',
  url_param_ignore: 'ignore_image',
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

export default class ImageCachingPlugin extends Plugin {
  #log = new Logger('ImageCachingPlugin')

  public settings = {} as PluginSettings
  public state = {} as PluginState

  public api: ImageCachingAPI
  public markdown: MarkdownHandler

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest)

    this.api = new ImageCachingAPI(this)
    this.markdown = new MarkdownHandler(this)

    // thrid-party API
    // @ts-ignore non-standard API
    globalThis.ImageCaching = this.api
  }

  async onload(): Promise<void> {
    await this.loadSettings()
    this.addSettingTab(new SettingsTab(this))

    this.markdown.registerMarkdownProcessor()
  }

  async onunload(): Promise<void> {
    // TODO
  }

  async loadSettings(): Promise<void> {
    const log = this.#log.group('Loading Settings')
    const { cache_configs, ...primitives } = (await this.loadData()) || {}

    // ensure a fallback value is present
    // ensure order of configs and remotes
    this.settings = Object.assign({}, DEFAULT_SETTINGS, primitives)
    this.settings.cache_configs = prepareConfigs([
      ...(cache_configs || []),
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
      url_cache_matcher: prepareRemoteMatcher(this.settings.url_param_cache),
      url_ignore_matcher: prepareRemoteMatcher(this.settings.url_param_ignore),
    }
  }
}
