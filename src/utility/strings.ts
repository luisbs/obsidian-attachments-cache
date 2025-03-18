export function compareBySpecificity(a: string, b: string): number {
    //[
    //  '*',
    //  'example.com',
    //  'example.com/images',
    //  '*/all',
    //  'example.com/blog',
    //  'images.org',
    //  'example.com/blog/asd',
    //]
    // becomes ⬇️
    //[
    //  'example.com/blog/asd',
    //  'example.com/blog',
    //  'example.com/images',
    //  'example.com',
    //  'images.org',
    //  '*/all',
    //  '*',
    //]

    //
    // `*` means all, it should come last
    if (!a.startsWith('*') && b.startsWith('*')) return -1
    if (a.startsWith('*') && !b.startsWith('*')) return 1

    // prioritize specificity
    if (a.startsWith(b)) return -1
    if (b.startsWith(a)) return 1

    // order alfabetically
    return a.localeCompare(b, 'en')
}

export function getMimeExt(mime: string): string {
    // @See: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
    // prettier-ignore
    switch (mime) {
        // MIME maps to many EXT
        // - 'image/jpeg': jpg,jpeg, ...etc
        // - 'image/tiff': tif,tiff
        case 'image/jpeg': return 'jpg'
        case 'image/tiff': return 'tif'

        // MIME composed of EXT
        // - 'image/{apng,avif,gif,png,webp,bmp}'
        // - 'image/svg+xml': svg
        default: return mime.split(/\/|\+/gi)[1]
    }
}
