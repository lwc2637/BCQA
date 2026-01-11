"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { AppShell } from "@/components/shared/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileDown, Loader2 } from "lucide-react"

type ExportChecklistItem = {
  id: string
  label: string
}

const DEFAULT_ITEMS: ExportChecklistItem[] = [
  {
    id: "qa-complete",
    label: "I confirm the quality assurance checks have been completed.",
  },
  {
    id: "checklist-complete",
    label: "I confirm the checklist has been fully completed.",
  },
  {
    id: "evidence-attached",
    label: "I confirm all required photos/evidence have been attached.",
  },
  {
    id: "ready-to-export",
    label: "I confirm this run is ready to be exported to PDF.",
  },
]

export default function RunExportPage() {
  const params = useParams<{ id: string }>()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const [run, setRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const allChecked = useMemo(
    () => DEFAULT_ITEMS.every((i) => Boolean(checked[i.id])),
    [checked],
  )

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/runs/${params.id}`)
        const data = await res.json()
        setRun(data.run || null)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [API_URL, params.id])

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
    setExportError(null)
  }

  const handleExport = async () => {
    if (!allChecked || exporting) return
    setExporting(true)
    setExportError(null)
    try {
      const res = await fetch(`${API_URL}/runs/${params.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declaration_checks: DEFAULT_ITEMS.map((i) => ({ id: i.id, label: i.label })),
        }),
      })

      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || "Export failed")
      }

      const payload = await res.json()
      const pdfUrl: string = payload.pdf_url
      const finalUrl = pdfUrl?.startsWith("http") ? pdfUrl : `${API_URL}${pdfUrl}`
      window.open(finalUrl, "_blank", "noopener,noreferrer")
    } catch (e: any) {
      setExportError(e?.message || "Export failed")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        <div className="flex items-center space-x-4">
          <Link href={`/runs/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-xl font-bold">Declaration &amp; Export</h1>
            {run && (
              <p className="text-sm text-muted-foreground">
                {run.site_name} • {run.p_ref}
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <p className="font-semibold">Declaration</p>
              <p className="text-sm text-muted-foreground">
                Tick all boxes to enable PDF export.
              </p>
            </div>

            <div className="space-y-3">
              {DEFAULT_ITEMS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-accent/40 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={Boolean(checked[item.id])}
                    onChange={() => toggle(item.id)}
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>

            {exportError && (
              <div className="text-sm text-destructive">{exportError}</div>
            )}

            <Button
              className="w-full"
              onClick={handleExport}
              disabled={!allChecked || exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF Export
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

