import type { ImageCachingPlugin } from '@/types'

export class MarkdownHandler {
  constructor(private plugin: ImageCachingPlugin) {}

  public registerMarkdownProcessor(): void {
    this.plugin.registerMarkdownPostProcessor(
      (element, ctx) => {
        element.querySelectorAll('img').forEach(async (el) => {
          const resolved = await this.plugin.api.cache(ctx.sourcePath, el.src)
          if (resolved) el.src = resolved
        })
      },
      // TODO: test this parameter
      // /**
      //  * higher number affects after,
      //  * ensuring it affects the output of other processors
      //  */ 10000,
    )
  }
}
