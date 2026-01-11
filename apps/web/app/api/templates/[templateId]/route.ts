import { proxy } from "@/app/api/_proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await context.params
  return proxy(request, `/templates/${templateId}`)
}

