import type { Translations } from './types'

/**
 * whenever `undefined` is used, is a placeholder
 */
export const EN: Translations = {
    // rule state elements
    ruleName: ['Rule ', ['code']],
    ruleDesc: ['Stores to ', ['code']],
    ruleNoteExample: ["Note: '", ['b'], "'"],
    ruleFileExample: ["Attachment: '", ['b'], "'"],
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
    //
    remoteState_true: ['Whitelisted remote: ', ['code']],
    remoteState_false: ['Blacklisted remote: ', ['code']],
    remoteStateAction_true: 'Blacklist',
    remoteStateAction_false: 'Whitelist',
    // validations
    idEmpty: [['b', { text: 'id' }], ' may not be empty.'],
    patternEmpty: [['b', { text: 'pattern' }], ' may not be empty.'],
    storageEmpty: [['b', { text: 'storage' }], ' may not be empty.'],
    remotesEmpty: [['b', { text: 'remotes' }], ' may not be empty.'],
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
