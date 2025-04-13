import {
    type DocumentationSegment,
    type I18nSegments,
    I18nTranslator,
} from '@luis.bs/obsidian-fnc/lib/i18n/I18nTranslator'
import { EN } from './en'
import type { SupportedLocale, TranslationKeys, Translations } from './types'

export type * from './types'

export class I18n extends I18nTranslator<
    SupportedLocale,
    TranslationKeys,
    Translations
> {
    static #translations = Object.freeze({ en: EN })

    filterLocale(_locale?: string): SupportedLocale {
        // NOTE: for now there is not multilanguage support
        return 'en'
    }

    getTranslation(
        locale: SupportedLocale,
        key: TranslationKeys,
    ): string | I18nSegments {
        return I18n.#translations[locale][key]
    }

    docElementInfo([, id, text]: DocumentationSegment): DomElementInfo {
        return {
            text: text ?? 'docs',
            href: `https://github.com/luisbs/obsidian-attachments-cache/blob/main/docs/settings.md#${id}`,
        }
    }
}
