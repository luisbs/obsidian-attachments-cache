import { prepareRemoteRules, type RemoteRule } from '@/utility/remotes'
import type { TextAreaComponent, TextComponent } from 'obsidian'
import type { TranslationKeys } from './i18n'

export { I18n } from './i18n'

export type CacheRulekeys = 'id' | 'pattern' | 'storage' | 'remotes'
export type ValidatorResult = [TranslationKeys, string[]]
export type InputHandler = (
    input: TextComponent | TextAreaComponent,
    validator?: (value: string) => ValidatorResult[],
) => void

/** Serialize remotes as an string. */
export function serializeRemotes(remotes: RemoteRule[]): string {
    return remotes
        .map(({ whitelisted, pattern }) => {
            return `${whitelisted ? 'w' : 'b'} ${pattern}`
        })
        .join('\n')
}

/** Detects posible problems with the user defined remotes. */
export function checkRemotes(sources: string): ValidatorResult[] {
    const problems: ValidatorResult[] = []
    const values: string[] = []

    // one remote per-line
    for (const line of sources.split(/\n+/g)) {
        const trimmed = line.trim().replace(/^[wb]\s+/, '')
        if (values.includes(trimmed)) {
            problems.push(['remoteDuplicated', [trimmed]])
            continue
        }
        // store to identify duplicates
        values.push(trimmed)

        const [protocol, path] = trimmed.contains('://')
            ? trimmed.split('://')
            : ['', trimmed]

        if (!/^(\w+\.)+\w+/.test(path)) {
            problems.push(['remoteMissingDomain', [trimmed]])
        }
        if (!['', 'http', 'https'].includes(protocol)) {
            problems.push(['remoteInvalidProtocol', [trimmed]])
        }
    }

    return problems
}

/**
 * Parses a remote string, keeping whitelisted status if present.
 * - `'w example.com'` → `['example.com', true]`
 * - `'b example.com'` → `['example.com', false]`
 * - `'example.com'` → `['example.com', undefined]`
 */
export function parseRemote(source: string): [string, boolean | undefined] {
    if (!/\s+/.test(source)) return [source, undefined]

    const parts = source.split(/\s+/g)
    if (parts[0].startsWith('w')) return [parts[1], true]
    if (parts[0].startsWith('b')) return [parts[1], false]
    return [parts[1], undefined]
}

/** Splits a remotes string, keeping previous states when posible. */
export function parseRemotes(
    remotes: RemoteRule[],
    sources: string,
): RemoteRule[] {
    const result = [] as RemoteRule[]
    let hasFallback = false

    // one remote per-line
    for (const source of sources.split(/\n+/g)) {
        const [pattern, w] = parseRemote(source)
        if (pattern === '*') hasFallback = true

        // ignore duplicated entries
        if (result.some((b) => b.pattern === pattern)) continue

        // if has whitelisted definition, use it
        if (w !== undefined) {
            result.push({ pattern, whitelisted: w })
            continue
        }

        // search previous definition
        for (const s of remotes) {
            // try to match same patterns
            if (pattern === s.pattern) {
                result.push({ pattern, whitelisted: s.whitelisted })
                break
            }

            // try to match only with a diference of one character
            if (Math.abs(pattern.length - s.pattern.length) !== 1) continue

            // try to match the patterns
            if (s.pattern.startsWith(pattern)) {
                // example.com/path => example.com/pat
                result.push({ pattern, whitelisted: s.whitelisted })
                break
            } else if (pattern.startsWith(s.pattern)) {
                // example.com/path => example.com/paths
                result.push({ pattern, whitelisted: s.whitelisted })
                break
            }
        }

        // fallback behavior
        if (!result.some((b) => b.pattern === pattern)) {
            result.push({ pattern, whitelisted: false })
        }
    }

    if (!hasFallback) result.push({ pattern: '*', whitelisted: false })

    // sorting
    return prepareRemoteRules(result)
}
