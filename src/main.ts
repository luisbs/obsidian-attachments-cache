import { Logger, LogLevel } from '@luis.bs/obsidian-fnc'
import {
    MarkdownRenderer,
    Plugin,
    type App,
    type MarkdownPostProcessor,
    type PluginManifest,
} from 'obsidian'
import { AttachmentsCache } from './AttachmentsCacheApi'
import { detectRemotes, type DetectedRemote } from './commons/EditorFunctions'
import {
    prepareSettings,
    type AttachmentsCacheSettings,
} from './commons/PluginSettings'
import { prepareState, type AttachmentsCacheState } from './commons/PluginState'
import type { AttachmentsCacheApi } from './lib'
import { PluginSettingTab } from './settings/PluginSettingTab'

export default class AttachmentsCachePlugin extends Plugin {
    log = Logger.consoleLogger(AttachmentsCachePlugin.name)
    settings = {} as AttachmentsCacheSettings
    state = {} as AttachmentsCacheState

    #api: AttachmentsCacheApi
    #mpp?: MarkdownPostProcessor

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest)

        // * always printing the first loadSettings()
        // * after that, the user-defined level is used
        this.log.setLevel(LogLevel.DEBUG)
        this.log.setFormat('[hh:mm:ss.ms] level:')

        // thrid-party API
        this.#api = new AttachmentsCache(this)
        // @ts-expect-error non-standard API
        window.AttachmentsCache = this.#api
    }

    onunload(): void {
        // @ts-expect-error non-standard API
        delete window.AttachmentsCache
    }

    async onload(): Promise<void> {
        const group = this.log.group('Loading AttachmentsCache')

        this.settings = prepareSettings(await this.loadData())
        group.debug('Loaded: ', this.settings)

        this.addSettingTab(new PluginSettingTab(this))

        this.#prepareState(group)
        this.#registerHandlers()
        group.flush('Loaded AttachmentsCache')
    }

    async saveSettings(): Promise<void> {
        const group = this.log.group('Saving AttachmentsCache settings')

        await this.saveData(this.settings)
        group.debug('Saved: ', this.settings)

        this.#prepareState(group)
        group.flush('Saved AttachmentsCache settings')
    }

    #prepareState(log: Logger): void {
        log.info('Preparing AttachmentsCache state')
        this.state = prepareState(this.settings)

        this.log.setLevel(this.state.plugin_level)
        if (this.#mpp) this.#mpp.sortOrder = this.state.plugin_priority
    }

    #registerHandlers(): void {
        this.registerEvent(
            this.app.workspace.on('editor-paste', async (ev, editor, view) => {
                if (ev.defaultPrevented) return

                const notepath = view.file?.path
                if (!notepath) return

                const pasted = ev.clipboardData?.getData('text/plain')
                if (!pasted) return

                const matches = detectRemotes(pasted)
                if (matches.length < 1) return

                ev.preventDefault()

                // perform all caches
                const editions: Array<string | undefined> = []
                for (const match of matches) {
                    editions.push(await this.#handleEdition(match, notepath))
                }

                // no editions to the pasted content are required
                if (editions.length < 1) {
                    this.log.debug('Attachments cached on Paste', { pasted })
                    editor.replaceSelection(pasted)
                    return
                }

                // correctly edit the pasted content
                let offset = 0
                let result = pasted
                for (let i = 0; i < matches.length; i++) {
                    const e = editions[i]
                    if (!e) continue

                    const m = matches[i]
                    const head = result.substring(0, offset) // already replaced
                    const tail = result.substring(offset).replace(m.match, e) // replacing

                    result = head + tail
                    offset = head.length + e.length
                }

                console.log({ offset, result })
                this.log.debug('Attachments cached on Paste', { result })
                editor.replaceSelection(result)
                return
            }),
        )

        /**
         * Priorities sorts the **PostProcesors** order of execution, `higher == after`.
         * When **PostProcesors** use an `async` function, it is not awaited
         * so the sortOrder is not enforced.
         *
         * When a **PostProcesors** runs after the cache **PostProcesor**,
         * any attachment generated will not be detected.
         *
         * For context on priority of other plugins:
         * * luisbs/obsidian-components: `-100`
         * * blacksmithgu/obsidian-dataview: `-100`
         *
         * @default `1` caches attachments of normal PostProcesors (`priority = 0`)
         */
        this.#mpp = this.registerMarkdownPostProcessor(
            (element, { sourcePath: notepath, frontmatter: fm }) => {
                // static attachments can be archived
                element.querySelectorAll('img').forEach((imageEl) => {
                    void this.#handle(imageEl, notepath, (remote) => {
                        return this.#api.archive(remote, notepath, fm)
                    })
                })

                // dynamic attachments from async or slow PostProcessors
                // can only be cached and require a defered execution
                if (!this.state.plugin_timeout) return
                setTimeout(() => {
                    element.querySelectorAll('img').forEach((imageEl) => {
                        void this.#handle(imageEl, notepath, (remote) => {
                            return this.#api.cache(remote, notepath, fm)
                        })
                    })
                }, this.state.plugin_timeout)
            },
        )
    }

    async #handleEdition(match: DetectedRemote, notepath: string) {
        // use cache method to prevent replacement of the url on all file
        const localpath = await this.#api.cache(match.remote, notepath)
        if (localpath && this.#api.isArchivable(match.remote, notepath)) {
            return match.label
                ? `![[${localpath}|${match.label}]]`
                : `![[${localpath}]]`
        }
    }

    async #handle(
        imageEl: HTMLImageElement,
        notepath: string,
        resolve: (remote: string) => Promise<string | undefined>,
    ): Promise<void> {
        if (
            imageEl.hasClass('attachments-cache-cached') ||
            !imageEl.parentElement?.contains(imageEl)
        ) {
            // since handleAttachments runs twice,
            // it may have been handled already
            return
        }

        // restrain Obsidian from downloading the original URL
        const [remote, title] = [imageEl.src, imageEl.title]
        imageEl.addClass('attachments-cache-cached')
        imageEl.title = 'Caching...'
        imageEl.src = ''

        const localpath = await resolve(remote)
        if (!localpath) {
            imageEl.title = title
            imageEl.src = remote
            return
        }

        // images maybe rendered without change
        if (/\.(avif|bmp|gif|jpeg|jpg|png|svg|webp)($|#|\?)/.test(remote)) {
            const localFile = this.app.vault.getFileByPath(localpath)
            if (localFile) {
                imageEl.src = this.app.vault.getResourcePath(localFile)
                imageEl.title = title || remote
            } else imageEl.title = `Missing file '${localpath}'`
            return
        }

        // prettier-ignore
        const wrapperEl = createEl('p', { cls: 'auto attachments-cache-wrapper' })
        imageEl.parentElement.replaceChild(wrapperEl, imageEl)

        // let Obsidian handle the rendering
        // TODO: PDF attachments may be renderer shorter
        void MarkdownRenderer.render(
            this.app,
            `![[${localpath}|${title || remote}]]`,
            wrapperEl,
            notepath,
            this,
        )
    }
}
