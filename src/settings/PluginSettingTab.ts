import type AttachmentsCachePlugin from '@/main'
import { DEFAULT_CACHE_RULE, type CacheRule } from '@/utility/rules'
import type { AttachmentsCacheSettings } from '@/utility/settings'
import { PluginSettingTab as BaseSettingTab, Setting } from 'obsidian'
import { CacheRuleSettings } from './CacheRuleSettings'
import { I18n } from './settings-tools'

const i18n = new I18n()

export class PluginSettingTab extends BaseSettingTab {
    #plugin: AttachmentsCachePlugin
    #cacheRulesEl?: HTMLDivElement

    constructor(plugin: AttachmentsCachePlugin) {
        super(plugin.app, plugin)
        this.#plugin = plugin
    }

    #update<K extends keyof AttachmentsCacheSettings>(
        key: K,
        value: AttachmentsCacheSettings[K],
    ): void {
        this.#plugin.settings[key] = value
        void this.#plugin.saveSettings()
    }

    display(): void {
        this.containerEl.empty()
        this.containerEl.addClass('attachments-cache-settings')

        this.#displayGeneralSettings()

        const overridesSection = new Setting(this.containerEl).setHeading()
        overridesSection.setName(i18n.translate('overridesSection'))
        overridesSection.setDesc(i18n.translate('overridesSectionDesc'))
        this.#displayOverridesSettings()

        const cacheRulesSection = new Setting(this.containerEl).setHeading()
        cacheRulesSection.setName(i18n.translate('cacheRulesSection'))
        cacheRulesSection.addButton((button) => {
            button.setButtonText(i18n.translate('cacheRuleAdd'))
            button.onClick(() => {
                // shift all indexes by 1
                for (const [key, { childEl, index }] of this.#store.entries()) {
                    this.#store.set(key, { childEl, index: index + 1 })
                }

                // prepend the new CacheRule
                const key = this.#newKey()
                const cacheRule = { ...DEFAULT_CACHE_RULE, id: key }
                const childEl = this.#initCacheRuleSettings(key, cacheRule)
                this.#plugin.settings.cache_rules.unshift(cacheRule)
                this.#store.set(key, { childEl, index: 0 })

                // render new order
                this.#enableOrderButtons()
            })
        })

        // print currently defined CacheRules
        this.#cacheRulesEl = this.containerEl.createDiv()
        for (
            let index = 0;
            index < this.#plugin.settings.cache_rules.length;
            index++
        ) {
            const key = this.#newKey()
            const cacheRule = this.#plugin.settings.cache_rules[index]
            const childEl = this.#initCacheRuleSettings(key, cacheRule)
            this.#store.set(key, { index, childEl })
        }

        // enable initial order buttons
        this.#enableOrderButtons()
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

    #store = new Map<string, { index: number; childEl: CacheRuleSettings }>()
    #newKey(): string {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            const newId = Math.floor(Math.abs(Math.random() * 10e6)).toString()
            if (!this.#store.has(newId)) return newId
        }
    }

    #initCacheRuleSettings(
        key: string,
        cacheRule: CacheRule,
    ): CacheRuleSettings {
        const cacheRuleSetting = new CacheRuleSettings(cacheRule)

        cacheRuleSetting.onChange((newCacheRule) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const state = this.#store.get(key)!

            // persist CacheRule change
            this.#plugin.settings.cache_rules[state.index] = newCacheRule
            void this.#plugin.saveSettings()

            // CacheRuleSettings handles the state on its own
        })

        cacheRuleSetting.onRemove(() => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const state = this.#store.get(key)!

            // forget CacheRule
            this.#plugin.settings.cache_rules.splice(state.index)
            void this.#plugin.saveSettings()

            // update state
            this.#store.delete(key)
            // update index of CacheRules that where after the deleted
            for (const [key2, { childEl, index }] of this.#store.entries()) {
                if (index < state.index) continue
                this.#store.set(key2, { childEl, index: index - 1 })
            }

            // CacheRuleSettings handles the removing on its own
            this.#enableOrderButtons()
        })

        cacheRuleSetting.onMove((dir) => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const state = this.#store.get(key)!
            const indexAbove = dir === 'above' ? state.index - 1 : state.index
            const indexBelow = dir === 'above' ? state.index : state.index + 1
            const otherIndex = state.index + (dir === 'above' ? -1 : +1)

            // persist CacheRule reorder
            const temp = this.#plugin.settings.cache_rules[indexAbove]
            // prettier-ignore
            this.#plugin.settings.cache_rules[indexAbove] = this.#plugin.settings.cache_rules[indexBelow]
            this.#plugin.settings.cache_rules[indexBelow] = temp
            void this.#plugin.saveSettings()

            // switch state indexes
            for (const [key2, { childEl, index }] of this.#store.entries()) {
                if (index !== otherIndex) continue
                this.#store.set(key2, { childEl, index: state.index })
            }
            this.#store.set(key, { childEl: state.childEl, index: otherIndex })

            // render new order
            this.#enableOrderButtons()
        })

        return cacheRuleSetting
    }

    #enableOrderButtons(): void {
        if (!this.#cacheRulesEl) return

        const lastIndex = this.#store.size - 1
        const indexes: number[] = []
        const children: Record<number, CacheRuleSettings> = {}
        for (const { index, childEl } of this.#store.values()) {
            indexes.push(index)
            children[index] = childEl
        }

        // print new order
        this.#cacheRulesEl.empty()
        for (const index of indexes.sort()) {
            this.#cacheRulesEl.append(children[index].rootEl)
            children[index].enableOrderButtons(index === 0, index === lastIndex)
        }
    }
}
