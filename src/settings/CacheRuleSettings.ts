import { type CacheRule, resolveCachePath } from '@/commons/CacheRules'
import {
    type ExtraButtonComponent,
    Setting,
    type ToggleComponent,
} from 'obsidian'
import {
    type CacheRulekeys,
    checkRemotes,
    I18n,
    type InputHandler,
    type ValidatorResult,
} from './settings-tools'

type RemoveCallback = () => void
type ChangeCallback = (modified: CacheRule) => void
type MoveCallback = (direction: 'above' | 'below') => void

const NOTE_PATH = 'a/b/c/note1.md'
const FILE_NAME = 'img1.jpg'
const i18n = new I18n()

export class CacheRuleSettings {
    #rule: CacheRule

    #rootEl: HTMLDivElement
    #cacheRuleHeader: Setting
    #cacheRuleDetails: HTMLDivElement

    // state elements
    #headerEnabledComponent?: ExtraButtonComponent
    #detailsEnabledComponent?: ToggleComponent
    #detailsStorageExample: HTMLLIElement

    constructor(cache: CacheRule) {
        // cloned to control flow of updates
        this.#rule = { ...cache }

        // main distribution
        this.#rootEl = createDiv('cache-rule-settings')
        this.#cacheRuleHeader = new Setting(this.#rootEl)
        this.#cacheRuleDetails = createDiv('cache-rule-details')
        this.#detailsStorageExample = createEl('li')

        //
        this.#displayRuleHeader()
        this.#displayRuleDetails()
        this.#displayRuleState()
    }

    get rootEl(): HTMLDivElement {
        return this.#rootEl
    }

    #displayRuleHeader(): void {
        this.#cacheRuleHeader.addExtraButton((button) => {
            this.#headerEnabledComponent = button
            button.setIcon(this.#rule.enabled ? 'square-check-big' : 'square')
            button.setTooltip(
                i18n.translate(`cacheRule_enabled_${this.#rule.enabled}`),
            )
            button.onClick(() => this.#update('enabled', !this.#rule.enabled))
        })

        let hidden = true
        this.#cacheRuleHeader.addExtraButton((button) => {
            button.setIcon('settings-2')
            button.setTooltip(i18n.translate('cacheRuleEdit'))
            button.onClick(() => {
                hidden = !hidden
                if (hidden) this.#cacheRuleDetails.remove()
                else this.#rootEl.append(this.#cacheRuleDetails)
            })
        })

        this.#cacheRuleHeader.addExtraButton((button) => {
            this.#aboveButtonEl = button
            button.setDisabled(true)
            button.setIcon('chevron-up')
            button.setTooltip(i18n.translate('cacheRuleMoveAbove'))
            button.onClick(() => this.#moveListener?.('above'))
        })
        this.#cacheRuleHeader.addExtraButton((button) => {
            this.#belowButtonEl = button
            button.setDisabled(true)
            button.setIcon('chevron-down')
            button.setTooltip(i18n.translate('cacheRuleMoveBelow'))
            button.onClick(() => this.#moveListener?.('below'))
        })
    }

    #displayRuleDetails(): void {
        const enabledSetting = new Setting(this.#cacheRuleDetails)
        enabledSetting.setName(i18n.translate('cacheRule_enabledName'))
        enabledSetting.setDesc(i18n.translate('cacheRule_enabledDesc'))
        enabledSetting.addToggle((toggle) => {
            this.#detailsEnabledComponent = toggle
            toggle.setValue(this.#rule.enabled)
            toggle.onChange((value) => {
                // prevent second update when `setValue` is runned outside
                if (value === this.#rule.enabled) return
                this.#update('enabled', value)
            })
        })

        let state = 0
        const removeSetting = new Setting(this.#cacheRuleDetails)
        removeSetting.setName(i18n.translate('cacheRuleRemoveName'))
        removeSetting.setDesc(i18n.translate('cacheRuleRemoveDesc'))
        removeSetting.addButton((button) => {
            button.setButtonText(i18n.translate('remove'))
            button.onClick(() => {
                // 2-step deletion, to reduce unintentional removing the rule
                if (state > 1) {
                    this.#rootEl.remove()
                    this.#removeListener?.()
                } else {
                    state++
                    button.setButtonText(i18n.translate('removeConfirmation'))
                }
            })
        })

        const [idSetting, idHandler] = this.#initSetting('id')
        idSetting.addText((input) => {
            input.setValue(this.#rule.id)
            idHandler(input)
        })

        // prettier-ignore
        const [storageSetting, storageHandler, storageInfo] = this.#initSetting('storage')
        storageSetting.addText((input) => {
            input.setValue(this.#rule.storage)
            storageHandler(input)
        })
        // storage setting has an state element
        const storageUl = storageInfo.createEl('ul')
        const storageLi1 = storageUl.createEl('li')
        storageLi1.append(i18n.translate('cacheRuleNoteExample', [NOTE_PATH]))
        storageUl.append(this.#detailsStorageExample)

        //
        const [patternSetting, patternHandler] = this.#initSetting('pattern')
        patternSetting.addText((input) => {
            input.setValue(this.#rule.pattern)
            patternHandler(input)
        })

        // prettier-ignore
        const [remotesSetting, remotesHandler] = this.#initSetting('remotes')
        remotesSetting.addTextArea((input) => {
            input.setValue(this.#rule.remotes)
            remotesHandler(input, checkRemotes)
        })
    }

    #initSetting(key: CacheRulekeys): [Setting, InputHandler, HTMLDivElement] {
        const descEl = createFragment()
        const infoEl = descEl.createDiv()
        const logsEl = descEl.createEl('ul', 'invalid-value')
        i18n.appendTo(infoEl, `cacheRule_${key}Desc`)

        const setting = new Setting(this.#cacheRuleDetails)
        setting.setName(i18n.translate(`cacheRule_${key}Name`))
        setting.setDesc(descEl)

        const handler: InputHandler = (input, validator) => {
            input.setPlaceholder(i18n.translate(`cacheRule_${key}Hint`))
            input.onChange((source) => {
                const value = source.trim()
                const logs: ValidatorResult[] = []
                if (!value) logs.push(['valueMayNotBeEmpty', [key]])
                else if (validator) logs.push(...validator(value))

                logsEl.empty()
                if (logs.length) {
                    for (const [key, params] of logs) {
                        i18n.appendTo(logsEl.createEl('li'), key, params)
                    }
                    return
                }

                this.#update(key, value)
            })
        }

        return [setting, handler, infoEl]
    }

    #removeListener?: RemoveCallback
    #changeListener?: ChangeCallback
    #moveListener?: MoveCallback
    #aboveButtonEl?: ExtraButtonComponent
    #belowButtonEl?: ExtraButtonComponent

    onRemove(callback: RemoveCallback): void {
        this.#removeListener = callback
    }
    onChange(callback: ChangeCallback): void {
        this.#changeListener = callback
    }
    onMove(callback: MoveCallback): void {
        this.#moveListener = callback
    }
    enableOrderButtons(isFirst: boolean, isLast: boolean): void {
        this.#aboveButtonEl?.setDisabled(isFirst)
        this.#belowButtonEl?.setDisabled(isLast)
    }

    #update<K extends keyof CacheRule>(key: K, value: CacheRule[K]): void {
        this.#rule[key] = value
        this.#changeListener?.(this.#rule)
        this.#displayRuleState(key)
    }

    #displayRuleState(key?: keyof CacheRule): void {
        if (key === 'pattern' || key === 'remotes') return

        // prettier-ignore
        if (key === 'enabled') {
            this.#headerEnabledComponent?.setIcon(this.#rule.enabled ? 'square-check-big' : 'square')
            this.#headerEnabledComponent?.setTooltip(i18n.translate(`cacheRule_enabled_${this.#rule.enabled}`))
            this.#detailsEnabledComponent?.setValue(this.#rule.enabled)
            return
        }

        //
        this.#cacheRuleHeader
            .setName(i18n.translate('cacheRuleName', [this.#rule.id]))
            .setDesc(i18n.translate('cacheRuleDesc', [this.#rule.storage]))
        //
        this.#detailsStorageExample.empty()
        i18n.appendTo(this.#detailsStorageExample, 'cacheRuleFileExample', [
            resolveCachePath(this.#rule.storage, NOTE_PATH, FILE_NAME),
        ])
    }
}
