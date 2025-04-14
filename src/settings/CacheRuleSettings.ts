import { type CacheRule, resolveCachePath } from '@/utility/rules'
import {
    type ExtraButtonComponent,
    Setting,
    type TextAreaComponent,
    type ToggleComponent,
} from 'obsidian'
import {
    type CacheRulekeys,
    checkRemotes,
    I18n,
    type InputHandler,
    parseRemotes,
    serializeRemotes,
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
    #cacheRuleRemotes: HTMLDivElement

    // state elements
    #headerEnabledComponent?: ExtraButtonComponent
    #detailsEnabledComponent?: ToggleComponent
    #detailsRemotesComponent?: TextAreaComponent
    #detailsStorageExample: HTMLLIElement

    constructor(cache: CacheRule) {
        // cloned to control flow of updates
        this.#rule = { ...cache, remotes: [...cache.remotes] }

        // main distribution
        this.#rootEl = createDiv('cache-rule-settings')
        this.#cacheRuleHeader = new Setting(this.#rootEl)
        this.#cacheRuleDetails = createDiv('cache-rule-details')
        this.#cacheRuleRemotes = createDiv('cache-rule-remotes')
        this.#detailsStorageExample = createEl('li')

        //
        this.#displayRuleHeader()
        this.#displayRuleDetails()
        this.#displayRuleRemotes()
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

        let visible = false
        this.#cacheRuleHeader.addExtraButton((button) => {
            button.setIcon('settings-2')
            button.setTooltip(i18n.translate('cacheRuleEdit'))
            button.onClick(() => {
                if ((visible = !visible)) {
                    this.#rootEl.append(this.#cacheRuleDetails)
                    this.#rootEl.append(this.#cacheRuleRemotes)
                    this.#rootEl.addClass('show-details')
                } else {
                    this.#cacheRuleDetails.remove()
                    this.#cacheRuleRemotes.remove()
                    this.#rootEl.removeClass('show-details')
                }
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

    #displayRuleRemotes(): void {
        this.#cacheRuleRemotes.empty()
        for (const { whitelisted: w, pattern } of this.#rule.remotes) {
            const setting = new Setting(this.#cacheRuleRemotes)
            setting.setName(i18n.translate(`remoteState_${w}`, [pattern]))
            setting.addExtraButton((button) => {
                button.setIcon('trash-2')
                button.setTooltip(i18n.translate('remove'))
                button.onClick(() => {
                    const remotes = this.#rule.remotes //
                        .filter((r) => r.pattern !== pattern)

                    // TODO: solve recursive re-render
                    this.#update('remotes', remotes)
                    this.#detailsRemotesComponent //
                        ?.setValue(serializeRemotes(this.#rule.remotes))
                })
            })
            setting.addButton((button) => {
                button.setButtonText(i18n.translate(`remoteStateAction_${w}`))
                button.onClick(() => {
                    const remotes = this.#rule.remotes.map((r) => {
                        if (r.pattern !== pattern) return r
                        return { ...r, whitelisted: !r.whitelisted }
                    })

                    // TODO: solve recursive re-render
                    this.#update('remotes', remotes)
                    this.#detailsRemotesComponent?.setValue(
                        serializeRemotes(this.#rule.remotes),
                    )
                })
            })
        }
    }

    #displayRuleDetails(): void {
        const enabledSetting = new Setting(this.#cacheRuleDetails)
        enabledSetting.setName(i18n.translate('cacheRule_enabledName'))
        enabledSetting.setDesc(i18n.translate('cacheRule_enabledDesc'))
        enabledSetting.addToggle((toggle) => {
            this.#detailsEnabledComponent = toggle
            toggle.setValue(this.#rule.enabled)
            toggle.onChange((value) => this.#update('enabled', value))
        })

        // TODO: check why remove is not been done
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
            this.#detailsRemotesComponent = input
            input.setValue(serializeRemotes(this.#rule.remotes))
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

                if (key !== 'remotes') this.#update(key, value)
                else this.#update(key, parseRemotes(this.#rule.remotes, value))
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
        if (key === 'pattern') return
        if (key === 'remotes') {
            this.#displayRuleRemotes()
            return
        }

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
