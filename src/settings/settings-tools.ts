import type { TextAreaComponent, TextComponent } from 'obsidian'
import type { TranslationKeys } from './i18n'

export { I18n } from './i18n'

export type CacheRulekeys = 'id' | 'pattern' | 'storage' | 'remotes'
export type ValidatorResult = [TranslationKeys, string[]]
export type InputHandler = (
    input: TextComponent | TextAreaComponent,
    validator?: (value: string) => ValidatorResult[],
) => void

/** Detects posible problems with the user defined remotes. */
export function checkRemotes(remotes: string): ValidatorResult[] {
    const problems: ValidatorResult[] = []
    const patterns: string[] = []

    // one pattern per-line
    for (const line of remotes.split(/\n+/g)) {
        // ignore comment lines
        if (line.startsWith('#')) continue
        const [prefix, pattern] = line.split(' ')

        // badly prefixed lines
        if (prefix !== 'w' && prefix !== 'b') {
            problems.push(['patternInvalidPrefix', [line]])
            continue
        }

        // duplicated patterns
        if (patterns.includes(pattern)) {
            problems.push(['patternDuplicated', [pattern]])
            continue
        }
        // store to identify duplicates
        patterns.push(pattern)

        // fallback behavior
        if (pattern === '*') continue
        if (patterns.includes('*')) {
            problems.push(['patternAfterFallback', [pattern]])
            continue
        }

        // check protocol and domain
        const [protocol, path] = pattern.contains('://')
            ? pattern.split('://')
            : ['', pattern]

        if (protocol !== '' && protocol !== 'http' && protocol !== 'https') {
            problems.push(['patternInvalidProtocol', [pattern]])
        }
        if (!/^(\w+\.)+\w+/.test(path)) {
            problems.push(['patternInvalidDomain', [pattern]])
        }
    }

    return problems
}
