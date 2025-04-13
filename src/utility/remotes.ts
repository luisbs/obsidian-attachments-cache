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
