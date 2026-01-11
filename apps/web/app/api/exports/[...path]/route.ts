import { proxy } from "@/app/api/_proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  const safePath = (path ?? []).map(encodeURIComponent).join("/")
  return proxy(request, `/exports/${safePath}`)
}

