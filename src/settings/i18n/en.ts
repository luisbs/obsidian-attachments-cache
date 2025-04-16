import type { Translations } from './types'

/**
 * whenever `undefined` is used, is a placeholder
 */
export const EN: Translations = {
    learn: 'Learn more',
    remove: 'Remove',
    removeConfirmation: 'Are you sure?',
    valueMayNotBeEmpty: 'A value is required.',
    //
    // * General Section
    pluginLogLevelName: 'Log level',
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
    overridesSectionDesc: [
        'Available ways to override the defined ',
        ['b', { text: 'Cache Rules' }],
        '. ',
        ['docs', 'overrides-settings'],
    ],
    //
    urlIgnoreName: "URL's ignore param",
    urlIgnoreDesc: 'Forces the attachment to be ignored.',
    urlIgnoreHint: "like: 'ignore_file'",
    //
    urlCacheName: "URL's cache param",
    urlCacheDesc: 'Forces the attachment to be cached.',
    urlCacheHint: "like: 'cache_file'",
    //
    noteIgnoreName: "Note's ignore frontmatter attribute",
    noteIgnoreDesc: 'Forces all the note attachments to be ignored.',
    noteIgnoreHint: "like: 'cache_unless'",
    //
    noteCacheName: "Note's cache frontmatter attribute",
    noteCacheDesc: 'Forces all the note attachments to be cached.',
    noteCacheHint: "like: 'cache_from'",
    //
    noteCacheRuleName: "Note's CacheRule frontmatter attribute",
    noteCacheRuleDesc: [
        'Forces a note to follow certain CacheRule behavior. ',
        ['docs', 'notes-cacherule-frontmatter-attribute'],
    ],
    noteCacheRuleHint: "like: 'cache_rule'",
    //
    // * CacheRules Section
    cacheRulesSection: 'Cache Rules',
    cacheRuleAdd: 'Add CacheRule',
    cacheRuleEdit: 'Edit CacheRule',
    cacheRuleMoveAbove: 'Move above',
    cacheRuleMoveBelow: 'Move below',
    // ? CacheRules State
    cacheRuleName: ['Rule ', ['b']],
    cacheRuleDesc: ['Stores to ', ['code']],
    cacheRuleNoteExample: ["Note: '", ['b'], "'"],
    cacheRuleFileExample: ["Attachment: '", ['b'], "'"],
    //
    cacheRuleRemoveName: 'Remove this rule?',
    cacheRuleRemoveDesc: [
        'Is suggested you disable your rules, instead of removing them.',
        ['br'],
        ['b', { text: 'This can not be reversed.', cls: 'invalid-value' }],
    ],
    //
    cacheRule_enabledName: 'Is this rule enabled?',
    cacheRule_enabledDesc: 'When disabled the rule is ignored on caching.',
    cacheRule_enabled_true: 'Disable CacheRule',
    cacheRule_enabled_false: 'Enable CacheRule',
    //
    cacheRule_idName: 'Rule identifier',
    cacheRule_idDesc:
        'Name used to reference this rule on the notes frontmatter.',
    cacheRule_idHint: "like: 'images' or 'docs'",
    //
    cacheRule_patternName: 'Rule pattern',
    cacheRule_patternDesc: [
        'Glob pattern to match agains the note name.',
        ['br'],
        'Test your pattern with ',
        [
            'a',
            {
                text: 'this tool',
                href: 'https://www.digitalocean.com/community/tools/glob',
            },
        ],
        '.',
    ],
    cacheRule_patternHint: "glob: 'folder/**' or '**/(note|notes)-**'",
    //
    cacheRule_storageName: 'Rule storage',
    cacheRule_storageDesc: [
        'Some path variables are supported, like ',
        ['code', { text: '{folderpath}' }],
        ' or ',
        ['code', { text: '{notename}' }],
        ['br'],
        ['docs', 'cacherule-storage'],
    ],
    cacheRule_storageHint: "like: 'attachments/{notepath}'",
    //
    cacheRule_remotesName: 'Rule remotes',
    cacheRule_remotesDesc: [
        'List the urls to whitelist/blacklist prefixed with ',
        ['code', { text: 'w' }],
        ' or ',
        ['code', { text: 'b' }],
        ['br'],
        'Protocols can be omitted for more flexible matching.',
        ['br'],
        ['docs', 'cacherule-remotes'],
    ],
    cacheRule_remotesHint: "like: 'b domain.org/<optional_path>'",
    // ? CacheRuleRemotes Validations
    patternDuplicated: ['Duplicated: ', ['code']],
    patternAfterFallback: ['Lines after fallback(*) are useless', ['code']],
    patternInvalidPrefix: ['Invalid prefix: ', ['code']],
    patternInvalidProtocol: [
        'Only ',
        ['b', { text: 'http' }],
        ' or ',
        ['b', { text: 'https' }],
        ' protocols are supported: ',
        ['code'],
    ],
    patternInvalidDomain: ['Invalid URL domain: ', ['code']],
}
