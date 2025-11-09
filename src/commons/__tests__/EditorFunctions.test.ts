import { describe, expect, test } from 'vitest'
import { type DetectedRemote, detectRemotes } from '../EditorFunctions'

//
// Test Cases
//
const urlSource = 'https://samplelib.com/lib/preview/webm/sample-5s.webm'
const urlParsed: DetectedRemote = {
    label: '',
    match: urlSource,
    remote: urlSource,
    offset: 0,
}

const linkSource =
    '[](https://samplelib.com/lib/preview/wav/sample-3s.wav#sectiom)'
const linkParsed: DetectedRemote = {
    label: '',
    match: linkSource,
    remote: 'https://samplelib.com/lib/preview/wav/sample-3s.wav#sectiom',
    offset: 0,
}

const mediaSource =
    '![optional](https://samplelib.com/lib/preview/mp3/sample-3s.mp3#ids?ignore_file)'
const mediaParsed: DetectedRemote = {
    label: 'optional',
    match: mediaSource,
    remote: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3#ids?ignore_file',
    offset: 0,
}

const urlLength = urlSource.length
const linkLength = linkSource.length
const mediaLength = mediaSource.length
const mixedSource = `${linkSource}\n${urlSource}\n${mediaSource}\n${linkSource}`
const mixedParsed: DetectedRemote[] = [
    // links are parsed first
    { ...linkParsed },
    { ...mediaParsed, offset: linkLength + urlLength + 2 },
    { ...linkParsed, offset: linkLength + urlLength + mediaLength + 3 },
    // plain urls are parsed after
    { ...urlParsed, offset: linkLength + 1 },
]

describe('Testing EditorFuntions utilities', () => {
    test('detectRemotes', () => {
        expect(detectRemotes(urlSource)).toStrictEqual([urlParsed])
        expect(detectRemotes(linkSource)).toStrictEqual([linkParsed])
        expect(detectRemotes(mediaSource)).toStrictEqual([mediaParsed])
        expect(detectRemotes(mixedSource)).toStrictEqual(mixedParsed)
    })
})
