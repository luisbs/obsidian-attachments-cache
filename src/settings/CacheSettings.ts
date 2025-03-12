import type { CacheConfig, CacheRemote } from '@/types'
import { normalizePath, Setting, TextAreaComponent } from 'obsidian'
import {
    checkRemotes,
    parseRemotes,
    prepareResolver,
    serializeRemotes,
} from '@/utility'
import { docs } from './values'

type EventCallback = (cache: CacheConfig) => void

export class CacheSettings {
    #cache: CacheConfig
    #cacheHeader: Setting
    #cacheDetails: HTMLElement
    #cacheRemotes: HTMLElement
    #remotesText?: TextAreaComponent

    constructor(parent: HTMLElement, cache: CacheConfig) {
        // cloned to control flow of updates
        this.#cache = { ...cache, remotes: [...cache.remotes] }

        this.#cacheHeader = new Setting(parent)
        this.#cacheDetails =
            this.#cacheHeader.settingEl.createDiv('cache-details')
        this.#cacheRemotes =
            this.#cacheHeader.settingEl.createDiv('cache-remotes')

        this.#displayCacheHeader()
        this.#displayCacheDetails()
        this.#displayCacheRemotes()
    }

    #cacheName(): DocumentFragment {
        return createFragment((div) => {
            div.append(`Notes at: `)
            div.createEl('code').appendText(this.#cache.pattern)
        })
    }
    #cacheDesc(): DocumentFragment | string {
        return createFragment((div) => {
            div.append('Adds the attachment to:')
            div.createEl('code').appendText(this.#cache.target)
        })
    }
    #displayCacheHeader(): void {
        this.#cacheHeader.setName(this.#cacheName())
        this.#cacheHeader.setDesc(this.#cacheDesc())

        if (this.#cache.pattern !== '*') {
            this.#cacheHeader.addExtraButton((button) => {
                button.setIcon('trash-2').setTooltip('Remove')
                button.onClick(() => {
                    if (this.#cache.pattern === '*') {
                        console.warn("fallback config('*') can't be removed")
                        return
                    }

                    this.#cacheHeader.clear()
                    this.#cacheHeader.settingEl.remove()
                    this.#invokeRemove()
                })
            })
        }
        this.#cacheHeader.addToggle((toggle) => {
            toggle.setValue(this.#cache.enabled)
            toggle.onChange((value) => {
                this.#cache.enabled = value
                this.#invokeChange()

                this.#cacheHeader.setName(this.#cacheName())
            })
        })
        this.#cacheHeader.addExtraButton((button) => {
            let visible = false
            button.setIcon('chevron-down').setTooltip('Details')
            button.onClick(() => {
                visible = !visible
                if (visible) {
                    button.setIcon('chevron-up')
                    this.#cacheHeader.settingEl.addClass('show-details')
                } else {
                    button.setIcon('chevron-down')
                    this.#cacheHeader.settingEl.removeClass('show-details')
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

            const ul = div.createEl('ul')
            const note = ul.createEl('li')
            note.append("Note: '")
            note.createEl('b').appendText('a/b/c/note1.md')
            note.append("'")

            // prettier-ignore
            const example = normalizePath(
                prepareResolver(this.#cache.target)('a/b/c/note1.md') + '/img1.jpg',
            )

            const attachment = ul.createEl('li')
            attachment.append("Attachment: '")
            attachment.createEl('b').appendText(example)
            attachment.append("'")
        })
    }
    #displayCacheDetails(): void {
        const cacheSetting = new Setting(this.#cacheDetails)
        cacheSetting.setName('Attachments storage')
        cacheSetting.setDesc(this.#targetDesc())
        cacheSetting.addText((input) => {
            input.setValue(this.#cache.target)
            input.onChange((value) => {
                this.#cache.target = value
                this.#invokeChange()

                cacheSetting.setDesc(this.#targetDesc())
            })
        })

        const remotesDesc = createFragment()
        const remotesDescUl = remotesDesc.createEl('ul')
        const remotesSetting = new Setting(this.#cacheDetails)
        remotesSetting.setClass('remotes-input')
        remotesSetting.setName('Remotes')
        remotesSetting.setDesc(remotesDesc)
        remotesSetting.addTextArea((textarea) => {
            this.#remotesText = textarea
            textarea.setValue(serializeRemotes(this.#cache.remotes))
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

                this.#cache.remotes = parseRemotes(this.#cache.remotes, value)
                this.#invokeChange()
                this.#displayCacheRemotes()
            })
        })
    }

    #remoteName(r: CacheRemote): DocumentFragment {
        return createFragment((div) => {
            div.append(
                `${r.whitelisted ? 'Whitelisted' : 'Blacklisted'} remote: `,
            )
            div.createEl('code').appendText(r.pattern)
        })
    }
    #displayCacheRemotes(): void {
        this.#cacheRemotes.empty()

        for (const remote of this.#cache.remotes) {
            const setting = new Setting(this.#cacheRemotes)
            setting.setName(this.#remoteName(remote))

            if (remote.pattern !== '*') {
                setting.addExtraButton((button) => {
                    button.setIcon('trash-2').setTooltip('Remove')
                    button.onClick(() => {
                        const remotes = this.#cache.remotes //
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
                    const remotes = this.#cache.remotes.map((r) => {
                        if (r.pattern !== remote.pattern) return r
                        return { ...r, whitelisted: !r.whitelisted }
                    })
                    this.#updateRemotes(remotes)
                })
            })
        }
    }

    #updateRemotes(remotes: CacheRemote[]): void {
        this.#cache.remotes = remotes
        this.#invokeChange()

        this.#remotesText?.setValue(serializeRemotes(remotes))
        this.#displayCacheRemotes()
    }

    #changeListeners: EventCallback[] = []
    #removeListeners: EventCallback[] = []

    #invokeChange(): void {
        for (const listener of this.#changeListeners) listener(this.#cache)
    }
    #invokeRemove(): void {
        for (const listener of this.#removeListeners) listener(this.#cache)
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
