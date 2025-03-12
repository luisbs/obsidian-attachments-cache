import type {
    AttachmentsCachePlugin,
    CacheConfig,
    PluginSettings,
} from '@/types'
import {
    ButtonComponent,
    DropdownComponent,
    PluginSettingTab,
    Setting,
    TextComponent,
} from 'obsidian'
import { checkPattern, prepareConfigs } from '@/utility'
import { CacheSettings } from './CacheSettings'
import { docs, LEVEL_LABELS, PRIORITY_LABELS } from './values'

export class SettingsTab extends PluginSettingTab {
    #plugin: AttachmentsCachePlugin

    #configsList?: HTMLDivElement

    constructor(plugin: AttachmentsCachePlugin) {
        super(plugin.app, plugin)
        this.#plugin = plugin
    }

    display(): void {
        this.containerEl.empty()
        this.containerEl.addClass('attachments-cache-settings')

        this.#displayGeneralSettings()

        new Setting(this.containerEl).setName('Overrides').setHeading()
        this.#displayOverrideSettings()

        new Setting(this.containerEl).setName('Rules').setHeading()
        this.#displayConfigsHeader()
        this.#configsList = this.containerEl.createDiv('configs-list')
        this.#displayConfigsList()
    }

    #displayGeneralSettings(): void {
        const levelSetting = new Setting(this.containerEl)
        levelSetting.setName('Log level')
        levelSetting.setDesc(docs('Log level', 'To check the plugin logs'))
        levelSetting.addDropdown((dropdown) => {
            dropdown.addOptions(LEVEL_LABELS)
            dropdown.setValue(this.#plugin.settings.plugin_level)
            dropdown.onChange(this.#handle.bind(this, 'plugin_level'))
        })

        const prioritySetting = new Setting(this.containerEl)
        prioritySetting.setName('Cache priority')
        prioritySetting.setDesc(
            docs('Cache priority', 'Affects the attachments been cached'),
        )
        prioritySetting.addDropdown((dropdown) => {
            dropdown.addOptions(PRIORITY_LABELS)
            dropdown.setValue(this.#plugin.settings.plugin_priority)
            dropdown.onChange(this.#handle.bind(this, 'plugin_priority'))
        })

        const charsSetting = new Setting(this.containerEl)
        charsSetting.setName('Keep special characters')
        charsSetting.setDesc(
            'If you are having problems with special characters on paths, disable this setting.',
        )
        charsSetting.addToggle((toggle) => {
            toggle.setValue(this.#plugin.settings.allow_characters)
            toggle.onChange(this.#handle.bind(this, 'allow_characters'))
        })
    }

    #displayOverrideSettings(): void {
        const urlignore = new Setting(this.containerEl)
        urlignore.setName("URL's ignore param")
        urlignore.setDesc('Overrides rules and ignores the attachment.')
        urlignore.addText((input) => {
            input.setValue(this.#plugin.settings.url_param_ignore)
            input.onChange(this.#handle.bind(this, 'url_param_ignore'))
        })
        const urlcache = new Setting(this.containerEl)
        urlcache.setName("URL's cache param")
        urlcache.setDesc('Overrides rules and caches the attachment.')
        urlcache.addText((input) => {
            input.setValue(this.#plugin.settings.url_param_cache)
            input.onChange(this.#handle.bind(this, 'url_param_cache'))
        })

        const noteignore = new Setting(this.containerEl)
        noteignore.setName("Note's ignore frontmatter attribute")
        noteignore.setDesc('Overrides rules and ignores the Note attachments.')
        noteignore.addText((input) => {
            input.setValue(this.#plugin.settings.note_param_ignore)
            input.onChange(this.#handle.bind(this, 'note_param_ignore'))
        })
        const notecache = new Setting(this.containerEl)
        notecache.setName("Note's cache frontmatter attribute")
        notecache.setDesc('Overrides rules and caches the Note attachments.')
        notecache.addText((input) => {
            input.setValue(this.#plugin.settings.note_param_cache)
            input.onChange(this.#handle.bind(this, 'note_param_cache'))
        })
    }

    #displayConfigsHeader(): void {
        let patternInput: TextComponent | null = null
        let sourceDropdown: DropdownComponent | null = null
        let duplicateButton: ButtonComponent | null = null

        const headerDesc = createFragment()
        const headerDescUl = headerDesc.createEl('ul')

        const headerEl = new Setting(this.containerEl)
        headerEl.setClass('configs-header')
        headerEl.setName('Duplicate cache rule')
        headerEl.setDesc(headerDesc)
        headerEl.addDropdown((dropdown) => {
            sourceDropdown = dropdown
            dropdown.setValue('*')
            for (const config of this.#plugin.settings.cache_configs) {
                dropdown.addOption(config.pattern, config.pattern)
            }
        })
        headerEl.addText((input) => {
            patternInput = input
            input.setPlaceholder('glob: **/*.md')
            input.onChange((value) => {
                headerDescUl.empty()
                if (!value) {
                    duplicateButton?.setDisabled(true)
                    return
                }

                // handle validation
                const problems = checkPattern(
                    this.#plugin.settings.cache_configs,
                    value,
                )
                if (problems.length > 0) {
                    problems.forEach((p) =>
                        headerDescUl.createEl('li').appendText(p),
                    )
                    return
                }
                duplicateButton?.setDisabled(problems.length > 0)
            })
        })
        headerEl.addButton((button) => {
            duplicateButton = button
            button.setButtonText('Duplicate')
            button.setDisabled(true)
            button.onClick(() => {
                const match = patternInput?.getValue()
                const ref = sourceDropdown?.getValue() ?? '*'

                const src = this.#plugin.settings.cache_configs.find(
                    (i) => i.pattern === ref,
                )
                if (!match || !src) {
                    console.warn('unexpected state')
                    return
                }

                const configs = this.#plugin.settings.cache_configs
                configs.push({
                    pattern: match,
                    remotes: src.remotes,
                    enabled: src.enabled,
                    target: src.target,
                })
                this.#updateConfigs(configs)
            })
        })
    }

    #displayConfigsList(): void {
        if (!this.#configsList) return
        this.#configsList.empty()

        for (const cache of this.#plugin.settings.cache_configs) {
            const setting = new CacheSettings(this.#configsList, cache)
            setting.onChange((_cache) => {
                // re-render is already handle
                const configs = this.#plugin.settings.cache_configs //
                    .map((c) => (c.pattern === _cache.pattern ? _cache : c))
                this.#updateConfigs(configs)
            })
            setting.onRemove((_cache) => {
                // clean up of reder is already handle
                const configs = this.#plugin.settings.cache_configs //
                    .filter((c) => c.pattern !== _cache.pattern)
                this.#updateConfigs(configs)
            })
        }
    }

    #handle(key: keyof PluginSettings, value: unknown): void {
        // @ts-expect-error dynamic assignment
        this.#plugin.settings[key] = value
        void this.#plugin.saveSettings()
    }
    #updateConfigs(config: CacheConfig[]): void {
        this.#plugin.settings.cache_configs = prepareConfigs(config)
        void this.#plugin.saveSettings()
    }
}
