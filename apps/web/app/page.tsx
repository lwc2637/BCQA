"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { AppShell } from "@/components/shared/AppShell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Loader2, Trash2, Edit } from "lucide-react"

type TechBand = {
  band: number
  quantity: number
}

type ApiTechBand = number | { band: number; quantity: number }

interface Run {
  id: string
  template_id: string
  site_name: string
  p_ref: string
  engineer_name: string
  contractor_name?: string | null
  supplier_name?: string | null
  visit_date: string
  tech_bands: ApiTechBand[]
  ap_count: number
  status: string
  created_at: string
}

const EDIT_TECH_BANDS: TechBand[] = [
  { band: 1800, quantity: 0 },
  { band: 2600, quantity: 0 },
  { band: 3500, quantity: 0 },
]

const normalizeTechBands = (techBands: ApiTechBand[] | undefined): TechBand[] => {
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

  return EDIT_TECH_BANDS.map((bandItem) => ({
    ...bandItem,
    quantity: quantitiesByBand.get(bandItem.band) ?? 0,
  }))
}

export default function Home() {
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Edit state
  const [editingRun, setEditingRun] = useState<Run | null>(null)
  const [editForm, setEditForm] = useState({
    template_id: "cel_dot_v1",
    site_name: "",
    p_ref: "",
    engineer_name: "",
    contractor_name: "",
    supplier_name: "",
    visit_date: "",
    ap_count: 1,
  })
  const [editTechBands, setEditTechBands] = useState<TechBand[]>(EDIT_TECH_BANDS)
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/runs`)
      if (res.ok) {
        const data = await res.json()
        setRuns(data)
      }
    } catch (e) {
      console.error("Failed to fetch runs", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRuns()
  }, [fetchRuns])

  const deleteDraftRun = async (runId: string) => {
    const ok = confirm("Delete this draft checklist? This cannot be undone.")
    if (!ok) return

    setDeletingId(runId)
    try {
      const res = await fetch(`/api/runs/${runId}`, { method: "DELETE" })
      if (res.status === 204) {
        setRuns((prev) => prev.filter((r) => r.id !== runId))
        return
      }

      const body = await res.json().catch(() => null)
      alert(body?.detail || "Failed to delete draft")
    } catch (e) {
      console.error("Failed to delete draft", e)
      alert("Failed to delete draft")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditClick = (run: Run) => {
    setEditingRun(run)
    setEditForm({
      template_id: run.template_id ?? "cel_dot_v1",
      site_name: run.site_name ?? "",
      p_ref: run.p_ref ?? "",
      engineer_name: run.engineer_name ?? "",
      contractor_name: run.contractor_name ?? "",
      supplier_name: run.supplier_name ?? "",
      visit_date: run.visit_date ? String(run.visit_date).slice(0, 10) : "",
      ap_count: Number(run.ap_count ?? 1),
    })
    setEditTechBands(normalizeTechBands(run.tech_bands))
  }

  const handleEditTechBandQuantityChange = (band: number, quantity: number) => {
    setEditTechBands((prev) => prev.map((tb) => (tb.band === band ? { ...tb, quantity } : tb)))
  }

  const handleEditSave = async () => {
    if (!editingRun) return
    setSavingEdit(true)
    try {
      const selectedTechBands = editTechBands.filter((tb) => tb.quantity > 0)
      if (selectedTechBands.length === 0) {
        alert("Select at least one tech band (quantity 1-5).")
        return
      }

      const payload = {
        ...editForm,
        ap_count: Number(editForm.ap_count),
        tech_bands: selectedTechBands.map(({ band, quantity }) => ({ band, quantity })),
      }

      const res = await fetch(`/api/runs/${editingRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const updatedRun = await res.json()
        setRuns((prev) => prev.map((r) => (r.id === updatedRun.id ? updatedRun : r)))
        setEditingRun(null)
      } else {
        const body = await res.json().catch(() => null)
        alert(body?.detail || "Failed to update run")
      }
    } catch (e) {
      console.error("Failed to update run", e)
      alert("Failed to update run")
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Link href="/runs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New BCQA Checklist
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Checklists</h2>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
              No runs found. Start a new checklist.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {runs.map((run) => (
                <div key={run.id} className="relative group">
                   <Link href={`/runs/${run.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                      <CardHeader className="relative">
                        <CardTitle>{run.site_name}</CardTitle>
                        <CardDescription>{run.p_ref} • {run.status}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(run.created_at).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {run.status === "draft" && (
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-background/50 hover:bg-background"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleEditClick(run)
                        }}
                        aria-label="Edit details"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-background/50 hover:bg-background text-destructive hover:text-destructive"
                        disabled={deletingId === run.id}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          deleteDraftRun(run.id)
                        }}
                        aria-label="Delete draft"
                      >
                        {deletingId === run.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editingRun} onOpenChange={(open) => !open && setEditingRun(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Checklist Details</DialogTitle>
            <DialogDescription>
              Update the front sheet details for this checklist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template_id">Checklist Type</Label>
              <select
                id="template_id"
                value={editForm.template_id}
                onChange={(e) => setEditForm({ ...editForm, template_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="cel_das_v1">DAS</option>
                <option value="cel_dot_v1">DOT</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={editForm.site_name}
                onChange={(e) => setEditForm({ ...editForm, site_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p_ref">TM Cell ID</Label>
              <Input
                id="p_ref"
                value={editForm.p_ref}
                onChange={(e) => setEditForm({ ...editForm, p_ref: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="engineer_name">Engineer Name</Label>
              <Input
                id="engineer_name"
                value={editForm.engineer_name}
                onChange={(e) => setEditForm({ ...editForm, engineer_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractor_name">Contractor</Label>
                <Input
                  id="contractor_name"
                  value={editForm.contractor_name}
                  onChange={(e) => setEditForm({ ...editForm, contractor_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier</Label>
                <Input
                  id="supplier_name"
                  value={editForm.supplier_name}
                  onChange={(e) => setEditForm({ ...editForm, supplier_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit_date">Visit Date</Label>
                <Input
                  id="visit_date"
                  type="date"
                  value={editForm.visit_date}
                  onChange={(e) => setEditForm({ ...editForm, visit_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap_count">AP Count</Label>
                <Input
                  id="ap_count"
                  type="number"
                  min={1}
                  value={String(editForm.ap_count)}
                  onChange={(e) => setEditForm({ ...editForm, ap_count: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tech Bands (Quantity 1-5)</Label>
              <div className="grid grid-cols-3 gap-4">
                {editTechBands.map((tb) => (
                  <div key={tb.band} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{tb.band} MHz</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={tb.quantity}
                      onChange={(e) => handleEditTechBandQuantityChange(tb.band, Number(e.target.value))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRun(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={savingEdit}>
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
