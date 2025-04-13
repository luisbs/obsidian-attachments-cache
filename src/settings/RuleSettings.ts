import { type CacheRule, resolveCachePath } from '@/utility/rules'
import { Setting, type TextAreaComponent } from 'obsidian'
import {
    type CacheRulekeys,
    checkRemotes,
    I18n,
    type InputHandler,
    parseRemotes,
    serializeRemotes,
    type ValidatorResult,
} from './settings-tools'

type EventCallback = (modified: CacheRule) => void
type MoveCallback = (direction: 'up' | 'down') => void

const NOTE_PATH = 'a/b/c/note1.md'
const FILE_NAME = 'img1.jpg'
const i18n = new I18n()

export class RuleSettings {
    #rule: CacheRule
    #parent: HTMLElement
    #ruleHeader: Setting
    #ruleDetails: HTMLDivElement
    #ruleRemotes: HTMLDivElement

    // state elements
    #headerNameEl: DocumentFragment
    #headerDescEl: DocumentFragment
    #storageEl: HTMLLIElement
    #remotesEl?: TextAreaComponent

    constructor(parent: HTMLElement, cache: CacheRule) {
        // cloned to control flow of updates
        this.#rule = { ...cache, remotes: [...cache.remotes] }
        this.#parent = parent

        // main distribution
        this.#ruleHeader = new Setting(this.#parent)
        this.#ruleDetails = this.#parent.createDiv('rule-details')
        this.#ruleRemotes = this.#parent.createDiv('rule-remotes')

        // elements that change with state
        this.#headerNameEl = createFragment()
        this.#headerDescEl = createFragment()
        this.#storageEl = createEl('li')

        //
        this.#displayRuleHeader()
        this.#displayRuleDetails()
        this.#displayRuleRemotes()
        this.#displayRuleState()
    }

    #displayRuleHeader(): void {
        this.#ruleHeader.setName(this.#headerNameEl)
        this.#ruleHeader.setDesc(this.#headerDescEl)

        this.#ruleHeader.addToggle((toggle) => {
            toggle.setValue(this.#rule.enabled)
            toggle.onChange((value) => this.#updateRule('enabled', value))
        })
        this.#ruleHeader.addExtraButton((button) => {
            button.setIcon('trash-2')
            button.setTooltip(i18n.translate('cacheRuleRemove'))
            button.onClick(() => this.#removeListener?.(this.#rule))
        })
        this.#ruleHeader.addExtraButton((button) => {
            let visible = false
            button.setIcon('settings-2')
            button.setTooltip(i18n.translate('cacheRuleEdit'))
            button.onClick(() => {
                visible = !visible
                if (visible) this.#parent.addClass('show-details')
                else this.#parent.removeClass('show-details')
            })
        })

        // priority sorting
        this.#ruleHeader.addExtraButton((button) => {
            if (this.#isFirst) button.setDisabled(true)
            button.setIcon('chevron-up')
            button.setTooltip(i18n.translate('cacheRuleMoveAbove'))
            button.onClick(() => this.#moveListener?.('up'))
        })
        this.#ruleHeader.addExtraButton((button) => {
            if (this.#isLast) button.setDisabled(true)
            button.setIcon('chevron-down')
            button.setTooltip(i18n.translate('cacheRuleMoveBelow'))
            button.onClick(() => this.#moveListener?.('down'))
        })
    }

    #displayRuleRemotes(): void {
        this.#ruleRemotes.empty()
        for (const { whitelisted: w, pattern } of this.#rule.remotes) {
            const setting = new Setting(this.#ruleRemotes)
            setting.setName(i18n.translate(`remoteState_${w}`, [pattern]))
            setting.addExtraButton((button) => {
                button.setIcon('trash-2')
                button.setTooltip(i18n.translate('remove'))
                button.onClick(() => {
                    const remotes = this.#rule.remotes //
                        .filter((r) => r.pattern !== pattern)

                    // TODO: solve recursive re-render
                    this.#updateRule('remotes', remotes)
                    this.#remotesEl //
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
                    this.#updateRule('remotes', remotes)
                    this.#remotesEl?.setValue(
                        serializeRemotes(this.#rule.remotes),
                    )
                })
            })
        }
    }

    #displayRuleDetails(): void {
        const [idSetting, idHandler] = this.#initSetting('id')
        idSetting.addText((input) => {
            input.setValue(this.#rule.id)
            idHandler(input)
        })

        const [patternSetting, patternHandler] = this.#initSetting('pattern')
        patternSetting.addText((input) => {
            input.setValue(this.#rule.pattern)
            patternHandler(input)
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
        storageUl.append(this.#storageEl)

        // prettier-ignore
        const [remotesSetting, remotesHandler] = this.#initSetting('remotes')
        remotesSetting.addTextArea((input) => {
            this.#remotesEl = input
            input.setValue(serializeRemotes(this.#rule.remotes))
            remotesHandler(input, checkRemotes)
        })
    }

    #initSetting(key: CacheRulekeys): [Setting, InputHandler, HTMLDivElement] {
        const descEl = createFragment()
        const infoEl = descEl.createDiv()
        const logsEl = descEl.createEl('ul', 'invalid-value')
        i18n.appendTo(infoEl, `${key}Desc`)

        const setting = new Setting(this.#ruleDetails)
        setting.setName(i18n.translate(`${key}Name`))
        setting.setDesc(descEl)

        const handler: InputHandler = (input, validator) => {
            input.setPlaceholder(i18n.translate(`${key}Hint`))
            input.onChange((source) => {
                const value = source.trim()
                const logs: ValidatorResult[] = []
                if (!value) logs.push([`${key}Empty`, []])
                else if (validator) logs.push(...validator(value))

                logsEl.empty()
                if (logs.length) {
                    input.inputEl.classList.add('invalid-value')
                    for (const [key, params] of logs) {
                        i18n.appendTo(logsEl.createEl('li'), key, params)
                    }
                    return
                }

                input.inputEl.classList.remove('invalid-value')
                if (key !== 'remotes') this.#updateRule(key, value)
                else {
                    this.#updateRule(
                        key,
                        parseRemotes(this.#rule.remotes, value),
                    )
                }
            })
        }

        return [setting, handler, infoEl]
    }

    #removeListener?: EventCallback
    #changeListener?: EventCallback
    #moveListener?: MoveCallback
    #isFirst = true
    #isLast = true

    onRemove(callback: EventCallback): void {
        this.#removeListener = callback
    }
    onChange(callback: EventCallback): void {
        this.#changeListener = callback
    }
    onMove(callback: MoveCallback): void {
        this.#moveListener = callback
    }
    enableOrderButtons(isFirst: boolean, isLast: boolean): void {
        this.#isFirst = isFirst
        this.#isLast = isLast
    }

    #updateRule<K extends keyof CacheRule>(key: K, value: CacheRule[K]): void {
        this.#rule[key] = value
        this.#changeListener?.(this.#rule)
        this.#displayRuleState(key)
    }

    #displayRuleState(key?: keyof CacheRule): void {
        if (key === 'enabled' || key === 'pattern') return
        if (key === 'remotes') {
            this.#displayRuleRemotes()
            return
        }

        // TODO: change function to recive 3 parameters
        const file = resolveCachePath(this.#rule.storage, NOTE_PATH, FILE_NAME)

        this.#headerNameEl.empty()
        this.#headerDescEl.empty()
        this.#storageEl.empty()

        i18n.appendTo(this.#headerNameEl, 'cacheRuleName', [this.#rule.id])
        i18n.appendTo(this.#headerDescEl, 'cacheRuleDesc', [this.#rule.storage])
        i18n.appendTo(this.#storageEl, 'cacheRuleFileExample', [file])
    }
}
