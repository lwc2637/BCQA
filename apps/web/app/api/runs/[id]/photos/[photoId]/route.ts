import { proxy } from "@/app/api/_proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; photoId: string }> },
) {
  const { id, photoId } = await context.params
  return proxy(request, `/runs/${id}/photos/${photoId}`)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; photoId: string }> },
) {
  const { id, photoId } = await context.params
  return proxy(request, `/runs/${id}/photos/${photoId}`)
}

