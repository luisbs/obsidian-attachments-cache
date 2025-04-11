import type { Translations } from './types'

/**
 * whenever `undefined` is used, is a placeholder
 */
export const EN: Translations = {
    ruleName: ['Notes at: ', ['code', undefined]],
    ruleDesc: ['Adds the attachment to: ', ['code', undefined]],
    //
    idName: 'Rule identifier',
    idDesc: 'Name used to reference this rule on the notes frontmatter.',
    idHint: "like: 'images' or 'docs'",
    idEmpty: [['b', { text: 'id' }], ' may not be empty.'],
    //
    patternName: 'Rule pattern',
    patternDesc: 'Glob pattern to match agains the note name.',
    patternHint: "glob: 'folder/**' or '**/(note|notes)-**'",
    patternEmpty: [['b', { text: 'pattern' }], ' may not be empty.'],
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
    storageEmpty: [['b', { text: 'storage' }], ' may not be empty.'],
    storageInputExample: ["Note: '", ['b', undefined], "'"],
    storageOutputExample: ["Attachment: '", ['b', undefined], "'"],
}
