export { default as AttachmentsCachePlugin } from './main'

/**
 *  Pre-calculated plugin state for performance.
 */
export interface PluginState {
    /** Pre-calculated path matchers. */
    cache_matchers: CacheMatcher[]
    /** Pre-calculated URL param matcher. */
    url_cache_matcher: RemoteMatcher
    /** Pre-calculated URL param matcher. */
    url_ignore_matcher: RemoteMatcher
    /** Pre-calculated Frontmatter param matcher. */
    note_cache_matcher: FrontmatterMatcher
    /** Pre-calculated Frontmatter param matcher. */
    note_ignore_matcher: FrontmatterMatcher
}

/** Test the remote against an URL-override rule. */
export type RemoteMatcher = (remote: string) => boolean
/** Test the remote against an Note-override rule. */
export type FrontmatterMatcher = (notepath: string, remote: string) => boolean

export interface CacheMatcher {
    /** Source of the matcher. */
    source: CacheConfig
    /** Determinates if the rule is enabled. */
    isEnabled(): boolean
    /** Checks if the remote matches. */
    testRemote(remote: string): boolean
    /** Checks if the path matches. */
    testPath(notepath: string): boolean
    /** Determinates the cachePath for the files. */
    resolve(notepath: string): string
}
export interface CacheConfig {
    /** Vault path glob pattern. */
    pattern: string
    /** Ordered list of remotes Whitelisted/Blacklisted. */
    remotes: CacheRemote[]
    /** Can be disabled instead of been removed. */
    enabled: boolean
    /** Used alongside **mode**. */
    target: string
}
export interface CacheRemote {
    /**
     * Whether the remote should be whitelisted/blacklisted.
     * - `true` means whitelisted
     * - `false` means blacklisted
     */
    whitelisted: boolean
    /** Remote pattern to match against. */
    pattern: string
}
