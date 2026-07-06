export async function onRequest(context: { request: Request; env: any }) {
  const { request, env } = context
  const url = new URL(request.url)
  const origin = url.origin

  let slugs: string[] = []
  try {
    const httpUrl = env.TURSO_DATABASE_URL.replace('libsql://', 'https://')
    const resp = await fetch(`${httpUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{ type: 'execute', stmt: { sql: "SELECT slug FROM movies", args: [] } }],
      }),
    })
    
    if (resp.ok) {
      const data = await resp.json() as any
      const result = data.results?.[0]?.response?.result
      const rawRows = result?.rows || []
      slugs = rawRows.map((r: any) => r[0]?.value).filter(Boolean)
    }
  } catch (e) {
    console.error("Sitemap DB fetch failed:", e)
  }

  const staticPages = [
    '',
    '/movies',
    '/series',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
  ]

  const urls = [
    ...staticPages.map(p => `${origin}${p}`),
    ...slugs.map(slug => `${origin}/watch/${slug}`)
  ]

  const xmlUrls = urls.map(u => `  <url>
    <loc>${u}</loc>
    <changefreq>daily</changefreq>
    <priority>${u === origin ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  })
}
