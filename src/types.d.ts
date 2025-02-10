import { LogLevel } from '@luis.bs/obsidian-fnc'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AttachmentError } from './utility'

export { default as AttachmentsCachePlugin } from './main'

/**
 *  Pre-calculated plugin state for performance.
 */
export interface PluginState {
    /** Pre-calculated path matchers. */
    cache_matchers: CacheMatcher[]
    /** Pre-calculated url matcher. */
    url_cache_matcher: RemoteMatcher
    /** Pre-calculated url matcher. */
    url_ignore_matcher: RemoteMatcher
}
export interface PluginSettings {
    /** Defines the minimun level to log while running. */
    log_level: keyof typeof LogLevel
    /** Stores the user preference over `UTF-8` characters. */
    allow_characters: boolean
    /** User defined URL-param to cache, overrides standard rules. */
    url_param_cache: string
    /** User defined URL-param to ignore, overrides standard rules. */
    url_param_ignore: string
    /** Stores the user defined vault paths to cache. */
    cache_configs: CacheConfig[]
}

/** Test the remote against a pre-defined rule. */
export type RemoteMatcher = (remote: string) => boolean

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
/**
 * Mode to store the values:
 * - `'NOTE'` alongside the note. (doesn't use target)
 * - `'NOTE-FOLDER'` alongside the note in a subfolder with the target as name.
 * - `'TARGET'` directly inside target path.
 * - `'TARGET-NOTE'` inside target path in a subfolder with the note-name.
 * - `'TARGET-PATH'` inside target path replicating note-path
 */
export type CacheMode =
    | 'NOTE'
    | 'NOTE-FOLDER'
    | 'TARGET'
    | 'TARGET-NOTE'
    | 'TARGET-PATH'
