export async function onRequest(context) {
  const { next } = context
  const response = await next()

  const url = new URL(context.request.url)
  if (url.pathname.startsWith('/assets/') && response.headers.get('content-type')?.includes('text/html')) {
    return new Response('Asset not found', { status: 404 })
  }

  const newHeaders = new Headers(response.headers)
  newHeaders.set('Access-Control-Allow-Origin', '*')
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}