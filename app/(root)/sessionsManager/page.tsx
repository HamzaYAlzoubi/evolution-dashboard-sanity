"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { sanityClient } from "@/sanity/lib/client"
import {
  USER_PROJECTS_WITH_SUBPROJECTS_QUERY,
  PROJECTS_WITH_SUBPROJECTS_QUERY,
} from "@/sanity/lib/queries"
import { events, EVENTS } from "@/lib/events"

interface Project {
  _id: string
  name: string
  status: string
  user: { _id: string; name: string; email: string }
  subProjects?: Array<{
    _id: string
    name: string
    status: string
    hours: number
    minutes: number
  }>
}

interface Session {
  _id: string
  date: string
  hours: number
  minutes: number
  notes: string
  user: { _id: string; name: string; email: string }
  project?: { _id: string; name: string }
}

export default function SessionsByDay() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [projects, setProjects] = useState<Project[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState<string[]>([])
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsSession, setDetailsSession] = useState<Session | null>(null)
  const [dailyTarget] = useState(4)
  const [isAssigningProject, setIsAssigningProject] = useState<string | null>(
    null
  )

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  // Fetch projects and sessions from Sanity
  const fetchData = useCallback(async () => {
    if (status !== "authenticated") return

    try {
      setLoading(true)

      // Fetch projects
      const query =
        session?.user?.role === "admin"
          ? PROJECTS_WITH_SUBPROJECTS_QUERY
          : USER_PROJECTS_WITH_SUBPROJECTS_QUERY

      const projectsData = await sanityClient.fetch(
        query,
        session?.user?.role !== "admin" ? { userId: session?.user?.id } : {}
      )
      setProjects(projectsData)

      // Fetch sessions
      const sessionsResponse = await fetch("/api/sessions")
      const sessionsResult = await sessionsResponse.json()
      if (sessionsResult.success) {
        console.log("Sessions data:", sessionsResult.data)
        if (sessionsResult.data.length > 0) {
          console.log("First session project:", sessionsResult.data[0].project)
        }
        setSessions(sessionsResult.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [status, session?.user?.role, session?.user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Listen for session updates to refresh data
  useEffect(() => {
    const handleSessionsUpdate = () => {
      fetchData()
    }

    events.on(EVENTS.SESSIONS_UPDATED, handleSessionsUpdate)

    return () => {
      events.off(EVENTS.SESSIONS_UPDATED, handleSessionsUpdate)
    }
  }, [fetchData])

  // Show loading while checking authentication or fetching data
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (status === "unauthenticated") {
    return null
  }

  const sessionsByDay = sessions.reduce<
    Record<string, { sessions: Session[]; totalMinutes: number }>
  >((acc, session) => {
    if (!acc[session.date])
      acc[session.date] = { sessions: [], totalMinutes: 0 }
    acc[session.date].sessions.push(session)
    acc[session.date].totalMinutes += session.hours * 60 + session.minutes
    return acc
  }, {})

  const sortedDays = Object.keys(sessionsByDay).sort((a, b) => (a > b ? -1 : 1))

  async function assignProject(sessionId: string, selectedId: string) {
    setIsAssigningProject(sessionId)

    const main = projects.find((p) => p._id === selectedId)

    let projectName = ""
    let displayName = ""
    if (main) {
      projectName = main.name
      displayName = main.name
    } else {
      const parent = projects.find((p) =>
        p.subProjects?.some((s) => s._id === selectedId)
      )
      const sub = parent?.subProjects?.find((s) => s._id === selectedId)
      if (parent && sub) {
        projectName = `${sub.name} — ضمن ${parent.name}`
        displayName = `${sub.name} / ${parent.name}`
      } else {
        setIsAssigningProject(null)
        return
      }
    }

    setSessions((prev) =>
      prev.map((sess) =>
        sess._id === sessionId
          ? { ...sess, project: { _id: selectedId, name: displayName } }
          : sess
      )
    )

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedId, projectName }),
      })
    } catch (error) {
      console.error("Error assigning project:", error)
    } finally {
      setIsAssigningProject(null)
    }
  }

  function confirmDelete() {
    if (!deleteSessionId) return
    setSessions((prev) => prev.filter((s) => s._id !== deleteSessionId))
    setDeleteDialogOpen(false)
    setDeleteSessionId(null)
  }

  // حساب الإنجاز الكلي
  const totalMinutesAllTime = sessions.reduce(
    (sum, s) => sum + s.hours * 60 + s.minutes,
    0
  )
  const totalHoursAllTime = Math.floor(totalMinutesAllTime / 60)
  const totalMinutesRemainder = totalMinutesAllTime % 60

  // توليد النجوم
  function renderStars(totalMinutes: number) {
    const fraction = Math.min(totalMinutes / (dailyTarget * 60), 1)
    const totalStars = 3
    const filledStars = fraction * totalStars

    return Array.from({ length: totalStars }, (_, i) => {
      const starValue = i + 1
      if (filledStars >= starValue) {
        return <Star key={i} className="text-yellow-400 fill-yellow-400" />
      } else if (filledStars > i && filledStars < starValue) {
        return (
          <Star
            key={i}
            className="text-yellow-400 fill-yellow-400 opacity-50"
          />
        )
      } else {
        return <Star key={i} className="text-gray-300" />
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* الإنجاز الكلي */}
      <Card className="shadow-lg rounded-2xl p-8 flex  flex-col items-center justify-between  ">
        <div className="flex flex-col items-center gap-2">
          <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
            الإنجاز منذ البداية
          </span>
          <Badge className="text-lg px-4 py-2 dark:bg-[#6866F1] bg-[#101828] dark:text-white rounded-xl shadow">{`${totalHoursAllTime}h ${totalMinutesRemainder}m`}</Badge>
        </div>

        <div className="flex flex-row-reverse justify-between items-center gap-6">
          <div className="flex flex-col items-center gap-2 ">
            <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
              إنجاز الشهر
            </span>
            <Badge className="text-lg px-4 py-2 dark:bg-[#6866F1] bg-[#101828] dark:text-white rounded-xl shadow">{`${totalHoursAllTime}h ${totalMinutesRemainder}m`}</Badge>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold  text-gray-700 dark:text-gray-200">
              إنجاز الأسبوع
            </span>
            <Badge className="text-lg px-4 py-2 dark:bg-[#6866F1] bg-[#101828] rounded-xl shadow">{`${totalHoursAllTime}h ${totalMinutesRemainder}m`}</Badge>
          </div>
        </div>
      </Card>

      <h1 className="text-2xl font-semibold mb-6">إدارة الجلسات حسب اليوم</h1>

      {sortedDays.length === 0 && (
        <p className="text-center text-gray-500">لا توجد جلسات لعرضها.</p>
      )}

      {sortedDays.map((date) => {
        const dayData = sessionsByDay[date]
        const isExpanded = expandedDays.includes(date)
        const hours = Math.floor(dayData.totalMinutes / 60)
        const minutes = dayData.totalMinutes % 60

        return (
          <Card key={date} className="cursor-pointer">
            <CardContent
              className="flex flex-col gap-4"
              onClick={() =>
                setExpandedDays((prev) =>
                  prev.includes(date)
                    ? prev.filter((d) => d !== date)
                    : [...prev, date]
                )
              }
            >
              {/* رأس اليوم */}
              <div className="flex justify-between items-center">
                <div className="font-semibold">
                  {date} - إجمالي الوقت: {hours}س {minutes}د
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderStars(dayData.totalMinutes)}
                  </div>
                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>

              {/* الجلسات */}
              {isExpanded && (
                <div className="space-y-3">
                  {dayData.sessions
                    .sort((a, b) => (a._id > b._id ? 1 : -1))
                    .map((session) => {
                      const sessionHours = session.hours
                      const sessionMinutes = session.minutes
                      return (
                        <Card
                          key={session._id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex justify-between items-center w-full">
                              <Select
                                value={session.project?._id || ""}
                                onValueChange={(val) =>
                                  assignProject(session._id, val)
                                }
                                disabled={isAssigningProject === session._id}
                              >
                                <SelectTrigger className=" dark:text-white overflow-hidden text-ellipsis">
                                  <SelectValue placeholder="اختر المشروع">
                                    {isAssigningProject === session._id ? (
                                      <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        تحديث...
                                      </div>
                                    ) : (
                                      session.project?.name || "اختر المشروع"
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {projects.map((proj) => (
                                    <div key={proj._id}>
                                      <SelectItem value={proj._id}>
                                        {proj.name}
                                      </SelectItem>
                                      {proj.subProjects?.map((sub) => (
                                        <SelectItem
                                          key={sub._id}
                                          value={sub._id}
                                        >
                                          {sub.name} / {proj.name}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="whitespace-nowrap font-extrabold text-gray-700 dark:text-white">
                                {sessionHours}h {sessionMinutes}m
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setDetailsSession(session)
                                  }}
                                >
                                  تفاصيل
                                </Button>

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteSessionId(session._id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  حذف
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* دايلوج الحذف */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>هل أنت متأكد من حذف الجلسة؟</DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دايلوج التفاصيل */}
      <Dialog
        open={!!detailsSession}
        onOpenChange={() => setDetailsSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ملاحظات الجلسة</DialogTitle>
          </DialogHeader>
          <div className="text-gray-700 dark:text-white text-lg whitespace-pre-wrap min-h-[60px]">
            {detailsSession?.notes || "لا توجد ملاحظات"}
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDetailsSession(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
