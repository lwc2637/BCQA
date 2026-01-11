import { proxy } from "@/app/api/_proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; questionId: string }> },
) {
  const { id, questionId } = await context.params
  return proxy(request, `/runs/${id}/questions/${questionId}/photos`)
}

