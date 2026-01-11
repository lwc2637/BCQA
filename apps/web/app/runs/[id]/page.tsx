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

export default function RunDashboard() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/runs/${params.id}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <AppShell>
      <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
    </AppShell>
  )

  if (!data) return <AppShell><div>Run not found</div></AppShell>

  const { run, template_summary, buckets } = data

  return (
    <AppShell>
      <div className="flex flex-col space-y-6">
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{run.site_name}</h1>
              <p className="text-muted-foreground">{run.p_ref} • {template_summary.name}</p>
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
