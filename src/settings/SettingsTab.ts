import type { CacheConfig, ImageCachingPlugin, PluginSettings } from '@/types'
import {
    ButtonComponent,
    DropdownComponent,
    PluginSettingTab,
    Setting,
    TextComponent,
} from 'obsidian'
import { checkPattern, prepareConfigs } from '@/utility'
import { CacheSettings } from './CacheSettings'

export class SettingsTab extends PluginSettingTab {
    #plugin: ImageCachingPlugin
    #settings: PluginSettings

    #configsList?: HTMLDivElement

    constructor(plugin: ImageCachingPlugin) {
        super(plugin.app, plugin)
        this.#plugin = plugin
        this.#settings = plugin.settings
    }

    hide() {
        // TODO: persist data
    }

    display(): void {
        this.containerEl.empty()
        this.containerEl.addClass('image-caching-settings')

        this.#displayGeneralSettings()

        this.#newSetting().setName('Paths Settings').setHeading()
        this.#displayConfigsHeader()
        this.#configsList = this.containerEl.createDiv('configs-list')
        this.#displayConfigsList()
    }

    #newSetting() {
        return this.#newSettingAt(this.containerEl)
    }

    #newSettingAt(container: HTMLElement) {
        return new Setting(container)
    }

    #displayGeneralSettings(): void {
        const charsSetting = this.#newSetting()
        charsSetting.setName('Keep Special Characters')
        charsSetting.setDesc(
            'If you are having problems with special characters on image paths, disable this setting.',
        )
        charsSetting.addToggle((toggle) => {
            toggle.setValue(this.#settings.allow_characters)
            toggle.onChange(this.#handle.bind(this, 'allow_characters'))
        })

        //#region URL params
        const urlcacheSetting = this.#newSetting()
        urlcacheSetting.setName('URL Param Cache')
        urlcacheSetting.setDesc('Overrides standard rules and stores the file.')
        urlcacheSetting.addText((input) => {
            input.setValue(this.#settings.url_param_cache)
            input.onChange(this.#handle.bind(this, 'url_param_cache'))
        })
        const urlignoreSetting = this.#newSetting()
        urlignoreSetting.setName('URL Param Ignore')
        urlignoreSetting.setDesc(
            'Overrides standard rules and ignores the file.',
        )
        urlignoreSetting.addText((input) => {
            input.setValue(this.#settings.url_param_ignore)
            input.onChange(this.#handle.bind(this, 'url_param_ignore'))
        })
        //#endregion
    }

    #displayConfigsHeader(): void {
        let patternInput: TextComponent | null = null
        let sourceDropdown: DropdownComponent | null = null
        let duplicateButton: ButtonComponent | null = null

        const headerDesc = createFragment()
        const headerDescUl = headerDesc.createEl('ul')

        const headerEl = this.#newSetting()
        headerEl.setClass('configs-header')
        headerEl.setName('Duplicate Vault Path')
        headerEl.setDesc(headerDesc)
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
                    this.#settings.cache_configs,
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
        headerEl.addDropdown((dropdown) => {
            sourceDropdown = dropdown
            dropdown.setValue('*')
            for (const config of this.#settings.cache_configs) {
                dropdown.addOption(config.pattern, config.pattern)
            }
        })
        headerEl.addButton((button) => {
            duplicateButton = button
            button.setButtonText('Duplicate')
            button.setDisabled(true)
            button.onClick(() => {
                const match = patternInput?.getValue()
                const ref = sourceDropdown?.getValue() ?? '*'

                const src = this.#settings.cache_configs.find(
                    (i) => i.pattern === ref,
                )
                if (!match || !src) {
                    console.warn('unexpected state')
                    return
                }

                const configs = this.#settings.cache_configs
                configs.push({
                    pattern: match,
                    remotes: src.remotes,
                    enabled: src.enabled,
                    target: src.target,
                    mode: src.mode,
                })
                this.#updateConfigs(configs)
            })
        })
    }

    #displayConfigsList(): void {
        if (!this.#configsList) return
        this.#configsList.empty()

        for (const cache of this.#settings.cache_configs) {
            const setting = new CacheSettings(this.#configsList, cache)
            setting.onChange((_cache) => {
                // re-render is already handle
                const configs = this.#settings.cache_configs //
                    .map((c) => (c.pattern === _cache.pattern ? _cache : c))
                this.#updateConfigs(configs)
            })
            setting.onRemove((_cache) => {
                // clean up of reder is already handle
                const configs = this.#settings.cache_configs //
                    .filter((c) => c.pattern !== _cache.pattern)
                this.#updateConfigs(configs)
            })
        }
    }

    #handle(key: keyof PluginSettings, value: unknown): void {
        // @ts-expect-error dynamic assignment
        this.#settings[key] = value
        void this.#plugin.saveSettings()
    }
    #updateConfigs(config: CacheConfig[]): void {
        this.#settings.cache_configs = prepareConfigs(config)
        void this.#plugin.saveSettings()
    }
}
