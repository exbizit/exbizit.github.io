const ORIGIN = 'https://hoster.band'

// Serve the existing build so both domains always receive the same updates.
export default {
  async fetch(request) {
    const url = new URL(request.url)
    const page = ['/', '/maryswhitelie', '/wallpaper'].includes(url.pathname)
    const asset = /^\/(assets|photos|fonts|skins)\//.test(url.pathname) ||
      /^\/(favicon[^/]*|apple-touch-icon\.png|robots\.txt)$/.test(url.pathname)

    if (!page && !asset) {
      return Response.redirect(`${ORIGIN}${url.pathname}${url.search}${url.hash}`, 302)
    }
    if (url.hostname === 'www.maryswhitelie.com') {
      url.hostname = 'maryswhitelie.com'
      return Response.redirect(url.toString(), 308)
    }
    const upstream = new URL(page ? '/' : url.pathname, ORIGIN)
    upstream.search = url.search
    const response = await fetch(upstream, { method: request.method === 'HEAD' ? 'HEAD' : 'GET' })
    const headers = new Headers(response.headers)
    // Avoid caching an old HTML shell after the shared build changes.
    if (page) headers.set('Cache-Control', 'no-cache')
    return new Response(response.body, { status: response.status, headers })
  },
}
