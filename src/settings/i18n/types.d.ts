import type { I18nSegments } from '@luis.bs/obsidian-fnc/lib/i18n/I18nTranslator'

export type TranslationKeys = SimpleTranslation | ComplexTranslation
export type Translations = Record<SimpleTranslation, string> &
    Record<ComplexTranslation, I18nSegments>

export type SupportedLocale = 'en'

type WhitelistState = boolean

export type SimpleTranslation =
    | `remoteStateAction_${WhitelistState}`
    //
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
    //
    | 'remotesName'
    | 'remotesHint'

export type ComplexTranslation =
    | 'ruleName'
    | 'ruleDesc'
    | 'ruleNoteExample'
    | 'ruleFileExample'
    | `remoteState_${WhitelistState}`
    //
    | 'storageDesc'
    | 'remotesDesc'
    // validations
    | 'idEmpty'
    | 'patternEmpty'
    | 'storageEmpty'
    | 'remotesEmpty'
    | 'remoteDuplicated'
    | 'remoteMissingDomain'
    | 'remoteInvalidProtocol'
