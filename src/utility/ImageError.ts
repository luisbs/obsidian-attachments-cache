import { RequestUrlResponse } from 'obsidian'

type ErrorCode =
  | 'remote-no-url'
  | 'remote-no-ext'
  | 'url-request-head'
  | 'url-request-get'

export class ImageError extends Error {
  /**
   * Check the response has a _**statusCode**_
   * @throws {ImageError}
   */
  static assertResponse(
    url: string,
    response: RequestUrlResponse,
    code: ErrorCode,
  ): void {
    if (response.status < 400) return

    throw new ImageError(
      code,
      `requested url: ${url}` +
        `\nresponse status: ${response.status}` +
        `\nresponse headers:\n${JSON.stringify(response.headers)}`,
    )
  }

  constructor(public code: ErrorCode, public cause?: unknown) {
    super()
    this.name = `ImageError(${this.code})`
    this.message = this.toStringMessage()
  }

  toString(): string {
    return `${this.name}: ${this.toStringMessage()}`
  }

  toStringMessage(): string {
    const message = ImageError.#description(this.code)
    if (!this.cause) return message
    return `${message}, context:\n\n${this.cause}`
  }

  static #description(code: ErrorCode): string {
    switch (code) {
      case 'remote-no-url':
        return 'remote param should be an URL'
      case 'remote-no-ext':
        return 'a file-extension could not be determined'

      case 'url-request-head':
        return 'the request to get the file-extension failed'
      case 'url-request-get':
        return 'the request to download the file failed'

      default:
        return 'try-reloading Obsidian'
    }
  }
}
