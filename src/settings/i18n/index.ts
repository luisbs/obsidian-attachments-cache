import {
    type DocumentationSegment,
    type I18nSegments,
    I18nTranslator,
    type ObsidianLanguages,
} from '@luis.bs/obsidian-fnc/lib/i18n/I18nTranslator'
import { en } from './en'
import type { TranslationKeys, Translations } from './types'

export type * from './types'

export type PluginLanguages = 'en'

export class I18n extends I18nTranslator<
    ObsidianLanguages,
    TranslationKeys,
    Translations
> {
    static #translations = Object.freeze({ en })

    protected filterLocale(_locale?: string): PluginLanguages {
        // NOTE: for now there is not multilanguage support
        // return this.currentLocale() ?? 'en'
        return 'en'
    }

    protected getTranslation(
        locale: PluginLanguages,
        key: TranslationKeys,
    ): string | I18nSegments {
        return I18n.#translations[locale][key]
    }

    protected docElementInfo(segment: DocumentationSegment): DomElementInfo {
        return {
            text: segment[2] ?? this.translate('learn'),
            href: `https://github.com/luisbs/obsidian-attachments-cache/blob/main/docs/settings.md#${segment[1]}`,
        }
    }
}
