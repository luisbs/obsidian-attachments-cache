import type AttachmentsCachePlugin from '@/main'
import { type CacheRule, prepareCacheRules } from '@/utility/rules'
import type { AttachmentsCacheSettings } from '@/utility/settings'
import { PluginSettingTab, Setting } from 'obsidian'
import { RuleSettings } from './RuleSettings'
import { I18n } from './settings-tools'

const i18n = new I18n()

export class SettingsTab extends PluginSettingTab {
    #plugin: AttachmentsCachePlugin
    #configsList?: HTMLDivElement

    constructor(plugin: AttachmentsCachePlugin) {
        super(plugin.app, plugin)
        this.#plugin = plugin
        console.log('SettingsTab')
    }

    #update(key: keyof AttachmentsCacheSettings, value: unknown): void {
        // @ts-expect-error dynamic assignment
        this.#plugin.settings[key] = value
        void this.#plugin.saveSettings()
    }
    #updateConfigs(config: CacheRule[]): void {
        this.#plugin.settings.cache_rules = prepareCacheRules(config)
        void this.#plugin.saveSettings()
    }

    display(): void {
        this.containerEl.empty()
        this.containerEl.addClass('attachments-cache-settings')

        this.#displayGeneralSettings()

        const overridesSection = new Setting(this.containerEl).setHeading()
        overridesSection.setName(i18n.translate('overridesSection'))
        this.#displayOverridesSettings()

        const cacheRulesSection = new Setting(this.containerEl).setHeading()
        cacheRulesSection.setName(i18n.translate('cacheRulesSection'))
        cacheRulesSection.addButton((button) => {
            button.setButtonText(i18n.translate('cacheRuleAdd'))
        })

        this.#configsList = this.containerEl.createDiv('configs-list')
        this.#displayConfigsList()
    }

    #displayGeneralSettings(): void {
        const pluginLogLevelSetting = new Setting(this.containerEl)
        pluginLogLevelSetting.setName(i18n.translate('pluginLogLevelName'))
        pluginLogLevelSetting.setDesc(i18n.translate('pluginLogLevelDesc'))
        pluginLogLevelSetting.addDropdown((dropdown) => {
            dropdown.setValue(this.#plugin.settings.plugin_level)
            dropdown.onChange(this.#update.bind(this, 'plugin_level'))
            dropdown.addOptions({
                ERROR: 'ERROR',
                WARN: ' WARN',
                INFO: ' INFO',
                DEBUG: 'DEBUG',
                TRACE: 'TRACE',
            })
        })

        const pluginPrioritySetting = new Setting(this.containerEl)
        pluginPrioritySetting.setName(i18n.translate('pluginPriorityName'))
        pluginPrioritySetting.setDesc(i18n.translate('pluginPriorityDesc'))
        pluginPrioritySetting.addDropdown((dropdown) => {
            dropdown.setValue(this.#plugin.settings.plugin_priority)
            dropdown.onChange(this.#update.bind(this, 'plugin_priority'))
            dropdown.addOptions({
                LOWER: i18n.translate('pluginPriorityOptionLower'),
                NORMAL: i18n.translate('pluginPriorityOptionNormal'),
                HIGHER: i18n.translate('pluginPriorityOptionHigher'),
            })
        })

        const allowCharactersSetting = new Setting(this.containerEl)
        allowCharactersSetting.setName(i18n.translate('allowCharactersName'))
        allowCharactersSetting.setDesc(i18n.translate('allowCharactersDesc'))
        allowCharactersSetting.addToggle((toggle) => {
            toggle.setValue(this.#plugin.settings.allow_characters)
            toggle.onChange(this.#update.bind(this, 'allow_characters'))
        })
    }

    #displayOverridesSettings(): void {
        const urlIgnoreSetting = new Setting(this.containerEl)
        urlIgnoreSetting.setName(i18n.translate('urlIgnoreName'))
        urlIgnoreSetting.setDesc(i18n.translate('urlIgnoreDesc'))
        urlIgnoreSetting.addText((input) => {
            input.setPlaceholder(i18n.translate('urlIgnoreHint'))
            input.setValue(this.#plugin.settings.url_param_ignore)
            input.onChange(this.#update.bind(this, 'url_param_ignore'))
        })
        const urlCacheSetting = new Setting(this.containerEl)
        urlCacheSetting.setName(i18n.translate('urlCacheName'))
        urlCacheSetting.setDesc(i18n.translate('urlCacheDesc'))
        urlCacheSetting.addText((input) => {
            input.setPlaceholder(i18n.translate('urlCacheHint'))
            input.setValue(this.#plugin.settings.url_param_cache)
            input.onChange(this.#update.bind(this, 'url_param_cache'))
        })

        const noteIgnoreSetting = new Setting(this.containerEl)
        noteIgnoreSetting.setName(i18n.translate('noteIgnoreName'))
        noteIgnoreSetting.setDesc(i18n.translate('noteIgnoreDesc'))
        noteIgnoreSetting.addText((input) => {
            input.setPlaceholder(i18n.translate('noteIgnoreHint'))
            input.setValue(this.#plugin.settings.note_param_ignore)
            input.onChange(this.#update.bind(this, 'note_param_ignore'))
        })
        const noteCacheSetting = new Setting(this.containerEl)
        noteCacheSetting.setName(i18n.translate('noteCacheName'))
        noteCacheSetting.setDesc(i18n.translate('noteCacheDesc'))
        noteCacheSetting.addText((input) => {
            input.setPlaceholder(i18n.translate('noteCacheHint'))
            input.setValue(this.#plugin.settings.note_param_cache)
            input.onChange(this.#update.bind(this, 'note_param_cache'))
        })
    }

    #displayConfigsList(): void {
        if (!this.#configsList) return
        this.#configsList.empty()

        for (const cache of this.#plugin.settings.cache_rules) {
            const setting = new RuleSettings(this.#configsList, cache)
            setting.onChange((_cache) => {
                // re-render is already handle
                const configs = this.#plugin.settings.cache_rules //
                    .map((c) => (c.pattern === _cache.pattern ? _cache : c))
                this.#updateConfigs(configs)
            })
            setting.onRemove((_cache) => {
                // clean up of reder is already handle
                const configs = this.#plugin.settings.cache_rules //
                    .filter((c) => c.pattern !== _cache.pattern)
                this.#updateConfigs(configs)
            })
        }
    }
}
