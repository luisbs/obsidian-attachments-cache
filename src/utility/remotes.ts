export interface RemoteRule {
    /**
     * Whether the remote should be whitelisted/blacklisted.
     * - `true` means whitelisted
     * - `false` means blacklisted
     */
    whitelisted: boolean
    /** Remote pattern to match against. */
    pattern: string
}

/** Serialize remotes as an string. */
export function serializeRemotes(remotes: RemoteRule[]): string {
    return remotes
        .map(({ whitelisted, pattern }) => {
            return `${whitelisted ? 'w' : 'b'} ${pattern}`
        })
        .join('\n')
}

/** Detects posible problems with the user defined remotes. */
export function checkRemotes(sources: string): string[] {
    const problems: string[] = []
    let hasFallback = false

    // one remote per-line
    for (const source of sources.split(/\n+/g)) {
        const trimmed = source.trim().replace(/^[wb]\s+/, '')
        if (trimmed === '*') {
            hasFallback = true
            continue
        }

        if (/^\w+:/gi.test(trimmed)) {
            problems.push("remove protocols, ex: 'http://'")
        }
        if (!/^(\w+\.)+\w+/.test(trimmed)) {
            problems.push("should include domain, ex: 'example.org/path'")
        }
    }

    if (!hasFallback) problems.unshift("should include a fallback '*'")

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

export function prepareRemoteRules(...remotes: RemoteRule[][]): RemoteRule[] {
    const _remotes: RemoteRule[] = []

    // keep only first RemoteRule appariences
    for (const a of remotes.flat()) {
        if (_remotes.some((b) => b.pattern === a.pattern)) continue
        _remotes.push(a)
    }

    // sort RemoteRules by specificity
    return _remotes.sort((a, b) => {
        // `*` is fallback, it should come last
        if (!a.pattern.startsWith('*') && b.pattern.startsWith('*')) return -1
        if (a.pattern.startsWith('*') && !b.pattern.startsWith('*')) return 1

        // prioritize specificity
        if (a.pattern.startsWith(b.pattern)) return -1
        if (b.pattern.startsWith(a.pattern)) return 1

        // order alfabetically
        return a.pattern.localeCompare(b.pattern, 'en')
    })
}
