import { proxy } from "@/app/api/_proxy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return proxy(request, "/templates/")
}

