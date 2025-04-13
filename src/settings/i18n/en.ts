import type { Translations } from './types'

/**
 * whenever `undefined` is used, is a placeholder
 */
export const EN: Translations = {
    remove: 'Remove',
    learn: 'Learn more',
    valueMayNotBeEmpty: 'A value is required.',
    //
    // * General Section
    pluginLogLevelName: ['Log level', ['docs', 'log-level']],
    pluginLogLevelDesc: [
        'Control the logs printed to the console. ',
        ['docs', 'log-level'],
    ],
    //
    pluginPriorityName: 'Cache priority',
    pluginPriorityDesc: [
        'Affects the attachments been cached. ',
        ['docs', 'cache-priority'],
    ],
    pluginPriorityOptionLower: 'Only cache static attachments',
    pluginPriorityOptionNormal: 'Cache most of the attachments',
    pluginPriorityOptionHigher: 'Cache all posible attachments',
    //
    allowCharactersName: 'Keep special characters',
    allowCharactersDesc: [
        'Disable if you are having problems with special characters on paths. ',
        ['docs', 'keep-special-characters'],
    ],
    //
    // * Overrides Section
    overridesSection: 'Overrides',
    urlIgnoreName: "URL's ignore param",
    urlIgnoreDesc: 'Overrides rules and ignores the attachment.',
    urlIgnoreHint: "like: 'ignore_file'",
    //
    urlCacheName: "URL's cache param",
    urlCacheDesc: 'Overrides rules and caches the attachment.',
    urlCacheHint: "like: 'cache_file'",
    //
    noteIgnoreName: "Note's ignore frontmatter attribute",
    noteIgnoreDesc: 'Overrides rules and ignores the Note attachments.',
    noteIgnoreHint: "like: 'cache_unless'",
    //
    noteCacheName: "Note's cache frontmatter attribute",
    noteCacheDesc: 'Overrides rules and caches the Note attachments.',
    noteCacheHint: "like: 'cache_from'",
    //
    // * CacheRules Section
    cacheRulesSection: 'Cache Rules',
    cacheRuleAdd: 'Add cache rule',
    cacheRuleEdit: 'Edit CacheRule',
    cacheRuleRemove: 'Remove CacheRule',
    cacheRuleMoveAbove: 'Move above',
    cacheRuleMoveBelow: 'Move below',
    // ? CacheRules State
    cacheRuleName: ['Rule ', ['code']],
    cacheRuleDesc: ['Stores to ', ['code']],
    cacheRuleNoteExample: ["Note: '", ['b'], "'"],
    cacheRuleFileExample: ["Attachment: '", ['b'], "'"],
    //
    idName: 'Rule identifier',
    idDesc: 'Name used to reference this rule on the notes frontmatter.',
    idHint: "like: 'images' or 'docs'",
    //
    patternName: 'Rule pattern',
    patternDesc: 'Glob pattern to match agains the note name.',
    patternHint: "glob: 'folder/**' or '**/(note|notes)-**'",
    //
    storageName: 'Rule storage',
    storageDesc: [
        'Some variables can be use, ex: ',
        ['code', { text: '{folderpath}' }],
        ' or ',
        ['code', { text: '{notename}' }],
        ['br'],
        'Check the ',
        ['docs', 'cacherule-storage'],
        ' for details.',
    ],
    storageHint: "like: 'attachments/{notepath}'",
    //
    remotesName: 'Rule remotes',
    remotesDesc: ['Check the ', ['docs', 'cacherule-remotes'], ' for details.'],
    remotesHint: "like: 'b domain.org/<optional_path>'",
    remoteState_true: ['Whitelisted remote: ', ['code']],
    remoteState_false: ['Blacklisted remote: ', ['code']],
    remoteStateAction_true: 'Blacklist',
    remoteStateAction_false: 'Whitelist',
    remoteDuplicated: ['Duplicated: ', ['code']],
    remoteMissingDomain: ['Missing domain: ', ['code']],
    remoteInvalidProtocol: [
        'Only ',
        ['b', { text: 'http' }],
        ' or ',
        ['b', { text: 'https' }],
        ' are supported: ',
        ['code'],
    ],
}
