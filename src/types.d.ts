import { CacheMode, PluginLevel, PluginPriority } from './settings/values'

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
export interface PluginSettings {
    /** Defines the minimun level to log while running. */
    plugin_level: PluginLevel
    /** Defines the **CachePostProcessor** priority.  */
    plugin_priority: PluginPriority
    /** Stores the user preference over `UTF-8` characters. */
    allow_characters: boolean
    /** User defined URL param to cache, overrides standard rules. */
    url_param_cache: string
    /** User defined URL param to ignore, overrides standard rules. */
    url_param_ignore: string
    /** User defined Frontmatter param to cache, overrides standard rules. */
    note_param_cache: string
    /** User defined Frontmatter param to ignore, overrides standard rules. */
    note_param_ignore: string
    /** Stores the user defined vault paths to cache. */
    cache_configs: CacheConfig[]
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
    /** Behavior of the cache rule. */
    mode: CacheMode
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
