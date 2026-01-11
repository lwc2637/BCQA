const getApiBaseUrl = () => {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
}

export const proxy = async (request: Request, targetPathname: string) => {
  const apiBaseUrl = getApiBaseUrl()
  const requestUrl = new URL(request.url)

  const targetUrl = new URL(apiBaseUrl)
  targetUrl.pathname = targetPathname
  targetUrl.search = requestUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("content-length")

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    const buffer = await request.arrayBuffer()
    init.body = Buffer.from(new Uint8Array(buffer))
  }

  const upstream = await fetch(targetUrl.toString(), init)
  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

