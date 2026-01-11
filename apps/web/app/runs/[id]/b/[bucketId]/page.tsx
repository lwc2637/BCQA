"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/shared/AppShell"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft, Camera, Trash2, ImageIcon, ChevronDown, ChevronRight, Upload } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Photo {
  id: string
  url: string
  thumbnail_url: string
  caption?: string
}

interface Answer {
  value?: string
  comment?: string
  photos: Photo[]
}

export default function BucketDetailPage() {
  const params = useParams()
  const [bucket, setBucket] = useState<any>(null)
  const [run, setRun] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [loading, setLoading] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  
  // Refs for file inputs
  const cameraInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const load = async () => {
      try {
        const runRes = await fetch(`${API_URL}/runs/${params.id}`)
        const runData = await runRes.json()
        
        setRun(runData.run || null)
        setAnswers(runData.answers || {})

        const tmplRes = await fetch(`${API_URL}/templates/${runData.template_summary.id}`)
        const tmplData = await tmplRes.json()
        
        const b = tmplData.buckets.find((b: any) => b.bucket_id === params.bucketId)
        setBucket(b)
        const baseGroups = b?.groups ?? []
        const hasApPhotos = b?.bucket_id === "access_points"
        const displayGroups = hasApPhotos
          ? [{ group_id: "ap_photos", title: "AP Photos", questions: [] }, ...baseGroups]
          : baseGroups
        setCollapsedGroups(Object.fromEntries(displayGroups.map((g: any) => [g.group_id, true])))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id, params.bucketId, API_URL])

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const handleAnswer = async (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], value }
    }))

    try {
      await fetch(`${API_URL}/runs/${params.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          value
        })
      })
    } catch (e) {
      console.error("Failed to save answer", e)
    }
  }

  const handleComment = async (questionId: string, comment: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], comment }
    }))
  }

  const saveComment = async (questionId: string, comment: string) => {
     try {
      await fetch(`${API_URL}/runs/${params.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          comment
        })
      })
    } catch (e) {
      console.error("Failed to save comment", e)
    }
  }

  const handlePhotoUpload = async (questionId: string, file: File) => {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_URL}/runs/${params.id}/questions/${questionId}/photos`, {
        method: 'POST',
        body: formData
      })
      const photo = await res.json()

      setAnswers(prev => {
        const current = prev[questionId] || { photos: [] }
        return {
          ...prev,
          [questionId]: {
            ...current,
            photos: [...current.photos, photo]
          }
        }
      })
    } catch (e) {
      console.error("Failed to upload photo", e)
    }
  }

  const handleDeletePhoto = async (questionId: string, photoId: string) => {
    setAnswers(prev => {
      const current = prev[questionId]
      if (!current) return prev
      return {
        ...prev,
        [questionId]: {
          ...current,
          photos: current.photos.filter(p => p.id !== photoId)
        }
      }
    })

    try {
      await fetch(`${API_URL}/runs/${params.id}/photos/${photoId}`, {
        method: 'DELETE'
      })
    } catch (e) {
       console.error("Failed to delete photo", e)
    }
  }

  const handleCaptionChange = async (questionId: string, photoId: string, caption: string) => {
      setAnswers(prev => {
        const current = prev[questionId]
        if (!current) return prev
        return {
          ...prev,
          [questionId]: {
            ...current,
            photos: current.photos.map(p => p.id === photoId ? { ...p, caption } : p)
          }
        }
      })
  }

  const saveCaption = async (photoId: string, caption: string) => {
      try {
        const formData = new FormData()
        formData.append('caption', caption)
        await fetch(`${API_URL}/runs/${params.id}/photos/${photoId}`, {
            method: 'PUT',
            body: formData
        })
      } catch(e) {
          console.error("Failed to save caption", e)
      }
  }

  if (loading) return <AppShell><div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div></AppShell>
  if (!bucket) return <AppShell><div>Bucket not found</div></AppShell>

  const apCount = Number(run?.ap_count ?? 0)

  return (
    <AppShell>
      <div className="space-y-6 pb-20 max-w-full overflow-x-hidden">
        <div className="flex items-center space-x-4">
          <Link href={`/runs/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{bucket.title}</h1>
        </div>

        <div className="space-y-8">
          {(bucket.bucket_id === "access_points"
            ? [{ group_id: "ap_photos", title: "AP Photos", questions: [] }, ...(bucket.groups ?? [])]
            : (bucket.groups ?? [])
          ).map((group: any) => {
            const isCollapsed = collapsedGroups[group.group_id]
            return (
              <div key={group.group_id} className="space-y-4">
                <div 
                  className="sticky top-14 bg-background z-10 py-2 border-b flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors px-2 rounded-md"
                  onClick={() => toggleGroup(group.group_id)}
                >
                  <h3 className="font-semibold text-lg text-muted-foreground">{group.title}</h3>
                  {isCollapsed ? <ChevronRight className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </div>
                
                {!isCollapsed && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                    {group.group_id === "ap_photos" ? (
                      apCount > 0 ? (
                        Array.from({ length: apCount }).map((_, index) => {
                          const apNumber = index + 1
                          const apQuestionId = `AP-PHOTO-${apNumber}`
                          const answer = answers[apQuestionId] || { photos: [] }
                          const hasPhotos = answer.photos.length > 0

                          return (
                            <Card
                              key={apQuestionId}
                              className={hasPhotos ? "overflow-hidden" : "overflow-hidden border-destructive/50"}
                            >
                              <CardContent className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <p className="font-medium">AP {apNumber}</p>
                                    {!hasPhotos && (
                                      <p className="text-xs text-destructive">Photo required</p>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Photos ({answer.photos.length})
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  {answer.photos.map((photo: Photo) => (
                                    <div key={photo.id} className="relative group border rounded-lg overflow-hidden">
                                      <div className="aspect-square bg-muted relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={photo.thumbnail_url || photo.url}
                                          alt="AP evidence"
                                          className="object-cover w-full h-full"
                                        />
                                        <button
                                          onClick={() => handleDeletePhoto(apQuestionId, photo.id)}
                                          className="absolute top-1 right-1 bg-black/50 text-white p-1.5 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                      <div className="p-2 bg-card">
                                        <Input
                                          className="h-7 text-xs px-2"
                                          placeholder="Caption..."
                                          value={photo.caption || ""}
                                          onChange={(e) => handleCaptionChange(apQuestionId, photo.id, e.target.value)}
                                          onBlur={(e) => saveCaption(photo.id, e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  ))}

                                  <div className="col-span-2 flex flex-col gap-3 w-full">
                                    <div
                                      className="w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors p-4 min-h-[80px]"
                                      onClick={() => cameraInputRefs.current[apQuestionId]?.click()}
                                    >
                                      <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                                      <span className="text-xs text-muted-foreground text-center font-medium">
                                        Take Photo
                                      </span>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        capture="environment"
                                        ref={(el) => {
                                          cameraInputRefs.current[apQuestionId] = el
                                        }}
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            handlePhotoUpload(apQuestionId, e.target.files[0])
                                            e.target.value = ""
                                          }
                                        }}
                                      />
                                    </div>

                                    <div
                                      className="w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors p-4 min-h-[80px]"
                                      onClick={() => uploadInputRefs.current[apQuestionId]?.click()}
                                    >
                                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                      <span className="text-xs text-muted-foreground text-center font-medium">
                                        Upload
                                      </span>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        ref={(el) => {
                                          uploadInputRefs.current[apQuestionId] = el
                                        }}
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            handlePhotoUpload(apQuestionId, e.target.files[0])
                                            e.target.value = ""
                                          }
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                      ) : (
                        <Card>
                          <CardContent className="p-4 text-sm text-muted-foreground">
                            Set AP Count on the front sheet to enable AP photo capture.
                          </CardContent>
                        </Card>
                      )
                    ) : (
                    group.questions.map((q: any) => {
                      const answer = answers[q.question_id] || { photos: [] }
                      return (
                        <Card key={q.question_id} className="overflow-hidden">
                          <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                              <p className="font-medium">{q.text}</p>
                              <p className="text-xs text-muted-foreground font-mono">{q.question_id}</p>
                            </div>
                            
                            {/* Answer Buttons */}
                            <div className="flex gap-2">
                              {['pass', 'fail', 'na'].map((val) => (
                                <Button 
                                  key={val}
                                  variant={answer.value === val ? "default" : "outline"}
                                  className={`flex-1 ${answer.value === val ? 
                                    (val === 'pass' ? 'bg-green-600 hover:bg-green-700' : 
                                     val === 'fail' ? 'bg-red-600 hover:bg-red-700' : 
                                     'bg-gray-600 hover:bg-gray-700') : ''}`}
                                  onClick={() => handleAnswer(q.question_id, val)}
                                >
                                  {val === 'na' ? 'N/A' : val.charAt(0).toUpperCase() + val.slice(1)}
                                </Button>
                              ))}
                            </div>

                            {/* Comment */}
                            <div>
                                <Textarea 
                                    placeholder="Add a comment..." 
                                    className="min-h-[60px]"
                                    value={answer.comment || ''}
                                    onChange={(e) => handleComment(q.question_id, e.target.value)}
                                    onBlur={(e) => saveComment(q.question_id, e.target.value)}
                                />
                            </div>

                            {/* Photos */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <Camera className="h-4 w-4" /> Photos ({answer.photos.length})
                                    </h4>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {answer.photos.map((photo: Photo) => (
                                        <div key={photo.id} className="relative group border rounded-lg overflow-hidden">
                                            <div className="aspect-square bg-muted relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={photo.thumbnail_url || photo.url} 
                                                    alt="Evidence" 
                                                    className="object-cover w-full h-full"
                                                />
                                                <button 
                                                    onClick={() => handleDeletePhoto(q.question_id, photo.id)}
                                                    className="absolute top-1 right-1 bg-black/50 text-white p-1.5 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div className="p-2 bg-card">
                                                <Input 
                                                    className="h-7 text-xs px-2" 
                                                    placeholder="Caption..." 
                                                    value={photo.caption || ''}
                                                    onChange={(e) => handleCaptionChange(q.question_id, photo.id, e.target.value)}
                                                    onBlur={(e) => saveCaption(photo.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Action Buttons */}
                                    <div className="col-span-2 flex flex-col gap-3 w-full">
                                        {/* Take Photo Button */}
                                        <div 
                                            className="w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors p-4 min-h-[80px]"
                                            onClick={() => cameraInputRefs.current[q.question_id]?.click()}
                                        >
                                            <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                                            <span className="text-xs text-muted-foreground text-center font-medium">Take Photo</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                capture="environment"
                                                ref={el => { cameraInputRefs.current[q.question_id] = el }}
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        handlePhotoUpload(q.question_id, e.target.files[0])
                                                        e.target.value = ''
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Upload Button */}
                                        <div 
                                            className="w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors p-4 min-h-[80px]"
                                            onClick={() => uploadInputRefs.current[q.question_id]?.click()}
                                        >
                                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                            <span className="text-xs text-muted-foreground text-center font-medium">Upload</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                // No capture attribute for generic upload
                                                ref={el => { uploadInputRefs.current[q.question_id] = el }}
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        handlePhotoUpload(q.question_id, e.target.files[0])
                                                        e.target.value = ''
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                          </CardContent>
                        </Card>
                      )
                    })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
