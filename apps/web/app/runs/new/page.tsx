"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { AppShell } from "@/components/shared/AppShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface Template {
  template_id: string
  name: string
  version: string
}

interface FormData {
  template_id: string
  p_ref: string
  site_name: string
  engineer_name: string
  contractor_name: string
  supplier_name: string
  visit_date: string
  ap_count: number
}

type TechBand = {
  band: number
  quantity: number
}

const DEFAULT_TECH_BANDS: TechBand[] = [
  { band: 1800, quantity: 0 },
  { band: 2600, quantity: 0 },
  { band: 3500, quantity: 0 },
]

export default function NewRunPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [techBands, setTechBands] = useState<TechBand[]>(DEFAULT_TECH_BANDS)
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      visit_date: new Date().toISOString().split('T')[0],
      ap_count: 1
    }
  })

  const handleQuantityChange = (band: number, quantity: number) => {
    setTechBands((prev) => prev.map((tb) => (tb.band === band ? { ...tb, quantity } : tb)))
  }

  useEffect(() => {
    fetch(`/api/templates`)
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(err => console.error(err))
  }, [])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const selectedTechBands = techBands.filter((tb) => tb.quantity > 0)
      if (selectedTechBands.length === 0) {
        alert("Select at least one tech band (quantity 1-5).")
        return
      }

      const payload = {
        ...data,
        tech_bands: selectedTechBands.map(({ band, quantity }) => ({ band, quantity })),
        ap_count: Number(data.ap_count)
      }
      
      const res = await fetch(`/api/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        const run = await res.json()
        router.push(`/runs/${run.id}`)
      } else {
        alert("Failed to create run")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template</label>
                <select 
                  {...register("template_id", { required: true })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a template...</option>
                  {templates.map(t => (
                    <option key={t.template_id} value={t.template_id}>
                      {t.name} (v{t.version})
                    </option>
                  ))}
                </select>
                {errors.template_id && <span className="text-red-500 text-sm">Required</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">P-Ref</label>
                  <Input {...register("p_ref", { required: true })} placeholder="123456" />
                  {errors.p_ref && <span className="text-red-500 text-sm">Required</span>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Site Name</label>
                  <Input {...register("site_name", { required: true })} placeholder="Site Name" />
                  {errors.site_name && <span className="text-red-500 text-sm">Required</span>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Engineer Name</label>
                <Input {...register("engineer_name", { required: true })} placeholder="John Doe" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <label className="text-sm font-medium">Contractor</label>
                  <Input {...register("contractor_name")} placeholder="Optional" />
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Input {...register("supplier_name")} placeholder="Optional" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visit Date</label>
                  <Input type="date" {...register("visit_date", { required: true })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">AP Count</label>
                  <Input type="number" {...register("ap_count", { required: true, min: 1 })} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tech Bands (Quantity 1-5)</label>
                <div className="grid grid-cols-3 gap-4">
                  {techBands.map((tb) => (
                    <div key={tb.band} className="space-y-1">
                      <label className="text-xs text-muted-foreground">{tb.band} MHz</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={tb.quantity}
                        onChange={(e) => handleQuantityChange(tb.band, Number(e.target.value))}
                      >
                        {[0, 1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save & Next
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
