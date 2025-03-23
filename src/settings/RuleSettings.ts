import { pathResolver } from '@/utility/matchers'
import {
    checkRemotes,
    parseRemotes,
    serializeRemotes,
    type RemoteRule,
} from '@/utility/remotes'
import { type CacheRule } from '@/utility/rules'
import { normalizePath, Setting, type TextAreaComponent } from 'obsidian'
import { docs } from './values'

type EventCallback = (cache: CacheRule) => void

export class RuleSettings {
    #rule: CacheRule
    #ruleHeader: Setting
    #ruleDetails: HTMLElement
    #ruleRemotes: HTMLElement
    #remotesText?: TextAreaComponent

    constructor(parent: HTMLElement, cache: CacheRule) {
        // cloned to control flow of updates
        this.#rule = { ...cache, remotes: [...cache.remotes] }

        this.#ruleHeader = new Setting(parent)
        this.#ruleDetails =
            this.#ruleHeader.settingEl.createDiv('cache-details')
        this.#ruleRemotes =
            this.#ruleHeader.settingEl.createDiv('cache-remotes')

        this.#displayCacheHeader()
        this.#displayCacheDetails()
        this.#displayRuleRemotes()
    }

    #ruleName(): DocumentFragment {
        return createFragment((div) => {
            div.append(`Notes at: `)
            div.createEl('code').appendText(this.#rule.pattern)
        })
    }
    #ruleDesc(): DocumentFragment | string {
        return createFragment((div) => {
            div.append('Adds the attachment to:')
            div.createEl('code').appendText(this.#rule.target)
        })
    }
    #displayCacheHeader(): void {
        this.#ruleHeader.setName(this.#ruleName())
        this.#ruleHeader.setDesc(this.#ruleDesc())

        if (this.#rule.pattern !== '*') {
            this.#ruleHeader.addExtraButton((button) => {
                button.setIcon('trash-2').setTooltip('Remove')
                button.onClick(() => {
                    if (this.#rule.pattern === '*') {
                        console.warn("fallback config('*') can't be removed")
                        return
                    }

                    this.#ruleHeader.clear()
                    this.#ruleHeader.settingEl.remove()
                    this.#invokeRemove()
                })
            })
        }
        this.#ruleHeader.addToggle((toggle) => {
            toggle.setValue(this.#rule.enabled)
            toggle.onChange((value) => {
                this.#rule.enabled = value
                this.#invokeChange()

                this.#ruleHeader.setName(this.#ruleName())
            })
        })
        this.#ruleHeader.addExtraButton((button) => {
            let visible = false
            button.setIcon('chevron-down').setTooltip('Details')
            button.onClick(() => {
                visible = !visible
                if (visible) {
                    button.setIcon('chevron-up')
                    this.#ruleHeader.settingEl.addClass('show-details')
                } else {
                    button.setIcon('chevron-down')
                    this.#ruleHeader.settingEl.removeClass('show-details')
                }
            })
        })
    }

    #targetDesc(): DocumentFragment {
        return createFragment((div) => {
            div.appendText('For usage of variables like')
            div.createEl('code', { text: '{folderpath}' })
            div.appendText(' or ')
            div.createEl('code', { text: '{notename}' })
            docs('Attachments storage', div)
            div.appendText('Path example: ')

            const ul = div.createEl('ul')
            const note = ul.createEl('li')
            note.append("Note: '")
            note.createEl('b').appendText('a/b/c/note1.md')
            note.append("'")

            // prettier-ignore
            const example = normalizePath(
                pathResolver(this.#rule.target)('a/b/c/note1.md') + '/img1.jpg',
            )

            const attachment = ul.createEl('li')
            attachment.append("Attachment: '")
            attachment.createEl('b').appendText(example)
            attachment.append("'")
        })
    }
    #displayCacheDetails(): void {
        const cacheSetting = new Setting(this.#ruleDetails)
        cacheSetting.setName('Attachments storage')
        cacheSetting.setDesc(this.#targetDesc())
        cacheSetting.addText((input) => {
            input.setValue(this.#rule.target)
            input.onChange((value) => {
                this.#rule.target = value
                this.#invokeChange()

                cacheSetting.setDesc(this.#targetDesc())
            })
        })

        const remotesDesc = createFragment()
        const remotesDescUl = remotesDesc.createEl('ul')
        const remotesSetting = new Setting(this.#ruleDetails)
        remotesSetting.setClass('remotes-input')
        remotesSetting.setName('Remotes')
        remotesSetting.setDesc(remotesDesc)
        remotesSetting.addTextArea((textarea) => {
            this.#remotesText = textarea
            textarea.setValue(serializeRemotes(this.#rule.remotes))
            textarea.onChange((value) => {
                // handle validation
                remotesDescUl.empty()
                const problems = checkRemotes(value)
                if (problems.length > 0) {
                    problems.forEach((p) =>
                        remotesDescUl.createEl('li').appendText(p),
                    )
                    return
                }

                this.#rule.remotes = parseRemotes(this.#rule.remotes, value)
                this.#invokeChange()
                this.#displayRuleRemotes()
            })
        })
    }

    #remoteName(r: RemoteRule): DocumentFragment {
        return createFragment((div) => {
            div.append(
                `${r.whitelisted ? 'Whitelisted' : 'Blacklisted'} remote: `,
            )
            div.createEl('code').appendText(r.pattern)
        })
    }
    #displayRuleRemotes(): void {
        this.#ruleRemotes.empty()

        for (const remote of this.#rule.remotes) {
            const setting = new Setting(this.#ruleRemotes)
            setting.setName(this.#remoteName(remote))

            if (remote.pattern !== '*') {
                setting.addExtraButton((button) => {
                    button.setIcon('trash-2').setTooltip('Remove')
                    button.onClick(() => {
                        const remotes = this.#rule.remotes //
                            .filter((r) => r.pattern !== remote.pattern)
                        this.#updateRemotes(remotes)
                    })
                })
            }

            setting.addButton((button) => {
                button.setButtonText(
                    remote.whitelisted ? 'Blacklist' : 'Whitelist',
                )
                button.onClick(() => {
                    const remotes = this.#rule.remotes.map((r) => {
                        if (r.pattern !== remote.pattern) return r
                        return { ...r, whitelisted: !r.whitelisted }
                    })
                    this.#updateRemotes(remotes)
                })
            })
        }
    }

    #updateRemotes(remotes: RemoteRule[]): void {
        this.#rule.remotes = remotes
        this.#invokeChange()

        this.#remotesText?.setValue(serializeRemotes(remotes))
        this.#displayRuleRemotes()
    }

    #changeListeners: EventCallback[] = []
    #removeListeners: EventCallback[] = []

    #invokeChange(): void {
        for (const listener of this.#changeListeners) listener(this.#rule)
    }
    #invokeRemove(): void {
        for (const listener of this.#removeListeners) listener(this.#rule)
    }

    onChange(callback: EventCallback): this {
        this.#changeListeners.push(callback)
        return this
    }
    onRemove(callback: EventCallback): this {
        this.#removeListeners.push(callback)
        return this
    }
}
