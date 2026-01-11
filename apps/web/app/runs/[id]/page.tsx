"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/shared/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Loader2, 
  ShieldCheck, 
  Server, 
  Zap, 
  Wifi, 
  HardHat, 
  ClipboardCheck, 
  DoorClosed, 
  Radio, 
  Cable,
  FileDown
} from "lucide-react"

// Icon mapping
const IconMap: Record<string, any> = {
  "shield-check": ShieldCheck,
  "server": Server,
  "zap": Zap,
  "wifi": Wifi,
  "hard-hat": HardHat,
  "clipboard-check": ClipboardCheck,
  "door-closed": DoorClosed,
  "radio": Radio,
  "cable": Cable
}

type ApiTechBand = number | { band: number; quantity?: number }

const DEFAULT_TECH_BANDS = [1800, 2600, 3500]

const normalizeTechBands = (techBands: ApiTechBand[] | undefined) => {
  const quantitiesByBand = new Map<number, number>()

  for (const tb of techBands ?? []) {
    if (typeof tb === "number") {
      quantitiesByBand.set(tb, Math.max(quantitiesByBand.get(tb) ?? 0, 1))
      continue
    }
    if (tb && typeof tb.band === "number") {
      quantitiesByBand.set(tb.band, tb.quantity ?? 0)
    }
  }

  return DEFAULT_TECH_BANDS.map((band) => ({
    band,
    quantity: quantitiesByBand.get(band) ?? 0,
  }))
}

const formatVisitDate = (dateStr?: string | null) => {
  if (!dateStr) return null
  const d = dateStr.includes("T") ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString()
}

const formatTechBandsSummary = (techBands: ApiTechBand[] | undefined) => {
  const selected = normalizeTechBands(techBands).filter((tb) => tb.quantity > 0)
  if (selected.length === 0) return null
  return selected.map((tb) => `${tb.band} MHz ×${tb.quantity}`).join(", ")
}

export default function RunDashboard() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!params.id) return
    setLoadError(null)
    fetch(`/api/runs/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(text || `Request failed (${res.status})`)
        }
        return res.json()
      })
      .then(setData)
      .catch((e) => {
        setData(null)
        setLoadError(e?.message || "Failed to fetch")
      })
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <AppShell>
      <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
    </AppShell>
  )

  if (!data) {
    return (
      <AppShell>
        <div className="p-6">
          {loadError ? (
            <div className="rounded-lg border p-4">
              <div className="font-semibold">Unable to load checklist</div>
              <div className="text-sm text-muted-foreground break-words">{loadError}</div>
            </div>
          ) : (
            <div>Run not found</div>
          )}
        </div>
      </AppShell>
    )
  }

  const { run, template_summary, buckets } = data
  const engineerName = run.engineer_name ?? run.engineerName
  const contractorName = run.contractor_name ?? run.contractorName
  const supplierName = run.supplier_name ?? run.supplierName
  const visitDate = run.visit_date ?? run.visitDate
  const apCount = run.ap_count ?? run.apCount
  const techBands = run.tech_bands ?? run.techBands

  const visitDateLabel = formatVisitDate(visitDate)
  const techBandsLabel = formatTechBandsSummary(techBands)
  const metaItems = [
    engineerName ? { label: "Engineer", value: engineerName } : null,
    contractorName ? { label: "Contractor", value: contractorName } : null,
    supplierName ? { label: "Supplier", value: supplierName } : null,
    visitDateLabel ? { label: "Visit Date", value: visitDateLabel } : null,
    typeof apCount === "number" ? { label: "AP Count", value: String(apCount) } : null,
    techBandsLabel ? { label: "Tech Bands", value: techBandsLabel } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <AppShell>
      <div className="flex flex-col space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{run.site_name}</h1>
              <p className="text-muted-foreground">{run.p_ref} • {template_summary.name}</p>
              {metaItems.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {metaItems.map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center rounded-md border bg-background/40 px-2 py-0.5 text-xs"
                    >
                      <span className="text-muted-foreground">{item.label}: </span>
                      <span className="ml-1 text-foreground">{item.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-primary text-primary-foreground shadow">
                {run.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {buckets.map((bucket: any) => {
            const Icon = IconMap[bucket.icon] || ClipboardCheck
            return (
              <Link key={bucket.bucket_id} href={`/runs/${run.id}/b/${bucket.bucket_id}`}>
                <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer active:scale-95 transition-transform duration-100">
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold leading-none">{bucket.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {bucket.completion_percentage}% Complete
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          <Link href={`/runs/${run.id}/export`}>
            <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer active:scale-95 transition-transform duration-100">
              <CardContent className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileDown className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold leading-none">Declaration &amp; Export</h3>
                  <p className="text-sm text-muted-foreground">Complete declaration to export PDF</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
