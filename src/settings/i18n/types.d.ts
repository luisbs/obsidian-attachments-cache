import type { I18nSegments } from '@luis.bs/obsidian-fnc'

export type TranslationKeys = TextTranslation | FlexibleTranslation
export type Translations = Record<TextTranslation, string> &
    Record<FlexibleTranslation, string | I18nSegments>

type Name_Desc = 'Name' | 'Desc'
type true_false = boolean

type Overrides_Settings =
    | `${'url' | 'note'}${'Ignore' | 'Cache'}`
    | 'noteCacheRule'

type CacheRule_Strings = 'id' | 'pattern' | 'storage' | 'remotes'
type CacheRule_Settings = 'remove' | 'enabled' | 'archive' | CacheRule_Strings

/** Translations that REQUIRE to be strings */
export type TextTranslation =
    | 'learn'
    | 'remove'
    | 'removeConfirmation'
    // * General Section
    | `pluginPriorityOption${'Lower' | 'Normal' | 'Higher'}`
    // * Overrides Section
    | `${Overrides_Settings}Hint`
    // * CacheRule Section
    | `cacheRule${'Add' | 'Edit' | 'MoveAbove' | 'MoveBelow'}`
    // ? CacheRule Settings
    | `cacheRule_enabled_${true_false}`
    | `cacheRule_${CacheRule_Strings}Hint`

/** Translations that not require to be strings */
export type FlexibleTranslation =
    | 'valueMayNotBeEmpty'
    // * General Section
    | `pluginLogLevel${Name_Desc}`
    | `pluginPriority${Name_Desc}`
    | `allowCharacters${Name_Desc}`
    // * Overrides Section
    | 'overridesSection'
    | 'overridesSectionDesc'
    | `${Overrides_Settings}${Name_Desc}`
    // * CacheRule Section
    | 'cacheRulesSection'
    // ? CacheRule State
    | `cacheRule${Name_Desc}`
    | `cacheRule${'Note' | 'File'}Example`
    // ? CacheRule Settings
    | `cacheRule_${CacheRule_Settings}${Name_Desc}`
    // ? CacheRuleRemotes Validations
    | 'patternDuplicated'
    | 'patternAfterFallback'
    | 'patternInvalidPrefix'
    | 'patternInvalidProtocol'
    | 'patternInvalidDomain'
