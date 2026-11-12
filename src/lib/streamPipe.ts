import { Readable } from 'stream'

type StreamResponse = {
  headersSent: boolean
  status: (code: number) => StreamResponse
  end: () => unknown
  destroy: (error?: Error) => unknown
}

/**
 * Node's pipe() attaches no 'error' listener to the source, so an upstream that
 * dies mid-transfer emits an unhandled 'error' and kills the whole process
 * (every API route starts 500ing at once).
 */
export function pipeUpstream(webStream: ReadableStream, res: StreamResponse): void {
  const source = Readable.fromWeb(webStream as any)
  source.on('error', (error) => {
    console.error('Upstream stream error:', error)
    if (res.headersSent) {
      res.destroy(error as Error)
    } else {
      res.status(502).end()
    }
  })
  source.pipe(res as any)
}
