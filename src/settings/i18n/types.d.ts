import type { I18nSegments } from '@luis.bs/obsidian-fnc/lib/i18n/I18nTranslator'

export type TranslationKeys = SimpleTranslation | ComplexTranslation
export type Translations = Record<SimpleTranslation, string> &
    Record<ComplexTranslation, I18nSegments>

export type SupportedLocale = 'en'

export type SimpleTranslation =
    | 'idName'
    | 'idDesc'
    | 'idHint'
    //
    | 'patternName'
    | 'patternDesc'
    | 'patternHint'
    //
    | 'storageName'
    | 'storageHint'

export type ComplexTranslation =
    | 'ruleName'
    | 'ruleDesc'
    //
    | 'idEmpty'
    | 'patternEmpty'
    //
    | 'storageDesc'
    | 'storageInputExample'
    | 'storageOutputExample'
    | 'storageEmpty'
