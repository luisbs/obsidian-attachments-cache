import type { I18nSegments } from '@luis.bs/obsidian-fnc/lib/i18n/I18nTranslator'

export type TranslationKeys = TextTranslation | FlexibleTranslation
export type Translations = Record<TextTranslation, string> &
    Record<FlexibleTranslation, string | I18nSegments>

export type SupportedLocale = 'en'

type Name_Desc = 'Name' | 'Desc'
type Overrides_Settings = `${'url' | 'note'}${'Ignore' | 'Cache'}`
type CacheRule_Settings = 'id' | 'pattern' | 'storage' | 'remotes'
type WhitelistState = boolean

/** Translations that REQUIRE to be strings */
export type TextTranslation =
    | 'remove'
    | 'learn'
    // * General Section
    | `pluginPriorityOption${'Lower' | 'Normal' | 'Higher'}`
    // * Overrides Section
    | `${Overrides_Settings}Hint`
    // * CacheRule Section
    | `cacheRule${'Add' | 'Edit' | 'Remove' | 'MoveAbove' | 'MoveBelow'}`
    // ? CacheRule Settings
    | `${CacheRule_Settings}Hint`
    | `remoteStateAction_${WhitelistState}`

/** Translations that not require to be strings */
export type FlexibleTranslation =
    | 'valueMayNotBeEmpty'
    // * General Section
    | `pluginLogLevel${Name_Desc}`
    | `pluginPriority${Name_Desc}`
    | `allowCharacters${Name_Desc}`
    // * Overrides Section
    | 'overridesSection'
    | `${Overrides_Settings}${Name_Desc}`
    // * CacheRule Section
    | 'cacheRulesSection'
    // ? CacheRule State
    | `cacheRule${Name_Desc}`
    | `cacheRule${'Note' | 'File'}Example`
    // ? CacheRule Settings
    | `${CacheRule_Settings}${Name_Desc}`
    | `remoteState_${WhitelistState}`
    | 'remoteDuplicated'
    | 'remoteMissingDomain'
    | 'remoteInvalidProtocol'
