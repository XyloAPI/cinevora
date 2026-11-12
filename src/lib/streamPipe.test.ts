import { describe, it, expect } from 'vitest'
import { Writable } from 'stream'
import { pipeUpstream } from '@/lib/streamPipe'

function createRes(chunks: Buffer[] = []) {
  const res: any = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.from(chunk))
      cb()
    },
  })
  res.headersSent = false
  res.statusCode = 200
  res.status = (code: number) => {
    res.statusCode = code
    return res
  }
  return res
}

describe('pipeUpstream', () => {
  it('forwards upstream bytes to the response', async () => {
    const chunks: Buffer[] = []
    const res = createRes(chunks)

    pipeUpstream(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('hello'))
          controller.close()
        },
      }),
      res
    )

    await new Promise((resolve) => res.on('finish', resolve))
    expect(Buffer.concat(chunks).toString()).toBe('hello')
  })

  it('survives an upstream that dies mid-transfer', async () => {
    const res = createRes()

    pipeUpstream(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]))
          setTimeout(() => controller.error(new Error('upstream reset')), 5)
        },
      }),
      res
    )

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(res.statusCode).toBe(502)
  })
})
