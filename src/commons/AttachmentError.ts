export class AttachmentError extends Error {
    constructor(
        message: string,
        public cause?: unknown,
    ) {
        super()
        this.name = `AttachmentError`
        this.message = message
        if (cause) {
            this.message += `\n\n${cause instanceof Error ? cause : JSON.stringify(cause)}`
        }
    }

    toString(): string {
        return `${this.name}: ${this.message}`
    }
}
