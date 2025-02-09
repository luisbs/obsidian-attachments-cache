import type { CacheConfig, CacheMatcher } from '@/types'
import { URI } from '@luis.bs/obsidian-fnc'
import { minimatch } from 'minimatch'
import { compareBySpecificity } from './strings'
import { prepareRemotes } from './remotes'

export function prepareConfigMatchers(configs: CacheConfig[]): CacheMatcher[] {
    return configs.map((config) => {
        // default: alongside the note
        let resolve = (_path: string) => URI.getParent(_path)
        switch (config.mode) {
            case 'NOTE-FOLDER': // alongside the note in a subfolder with the targetPath as name
                resolve = (_path: string) =>
                    URI.join(URI.getParent(_path), config.target)
                break
            case 'TARGET-PATH': // inside the targetPath replating the note-path, without `.md`
                resolve = (_path: string) =>
                    URI.join(config.target, URI.removeExt(_path))
                break
            case 'TARGET-NOTE': // inside the targetPath in a folder named as the note, without `.md`
                resolve = (_path: string) =>
                    URI.join(config.target, URI.getBasename(_path))
                break
            case 'TARGET': // directly inside the targetPath
                resolve = () => config.target
                break
        }

        const testPath =
            config.pattern !== '*'
                ? (_notepath: string) => minimatch(_notepath, config.pattern)
                : () => true
        const testRemote = (_remote: string) => {
            for (const { pattern, whitelisted } of config.remotes) {
                if (pattern === '*') return whitelisted
                if (
                    new RegExp('^https?://(\\w+\\.)*' + pattern, 'g').test(
                        _remote,
                    )
                ) {
                    return whitelisted
                }
            }
            return false
        }

        return {
            source: Object.freeze(config),
            isEnabled: () => config.enabled,
            testRemote,
            testPath,
            resolve,
        }
    })
}

export function prepareConfigs(configs: CacheConfig[]): CacheConfig[] {
    const result = [] as CacheConfig[]

    for (const a of configs) {
        // if is unique, keep it
        const bIndex = result.findIndex((b) => b.pattern === a.pattern)
        if (bIndex === -1) {
            // ensure remotes are sorted
            result.push({ ...a, remotes: prepareRemotes(a.remotes) })
            continue
        }

        // when duplicates, keep the more specific one
        if (a.remotes.length > result[bIndex].remotes.length) {
            // ensure remotes are sorted
            result[bIndex] = { ...a, remotes: prepareRemotes(a.remotes) }
        }
    }

    // ensure sorting of paths
    return result.sort((a, b) => compareBySpecificity(a.pattern, b.pattern))
}

export function checkPattern(configs: CacheConfig[], _value: string): string[] {
    if (!_value) return ['invalid pattern']
    for (const config of configs) {
        if (config.pattern === _value) return [`duplicated pattern '${_value}'`]
    }
    return []
}
