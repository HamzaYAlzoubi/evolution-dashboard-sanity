"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, MoreVertical, Settings } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { sanityClient } from "@/sanity/lib/client"
import {
  USER_PROJECTS_WITH_SUBPROJECTS_QUERY,
  PROJECTS_WITH_SUBPROJECTS_QUERY,
} from "@/sanity/lib/queries"
import { events, EVENTS } from "@/lib/events"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Switch } from "@/components/ui/switch"

/* --- SortableRow --- */
function SortableRow({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

interface Project {
  _id: string
  name: string
  status: "نشط" | "مكتمل" | "مؤجل"
  user: { _id: string; name: string; email: string }
  subProjects?: Array<{
    _id: string
    name: string
    status: "نشط" | "مكتمل" | "مؤجل"
    hours: number
    minutes: number
    sessionCount?: number
  }>
  totalSessionTime?: {
    hours?: number
    minutes?: number
  }
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // All hooks must be called at the top level, before any conditional returns
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string[]>([])

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "main" | "sub"
    projectId: string
    subId?: string
  } | null>(null)

  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addSubProjectDialogOpen, setAddSubProjectDialogOpen] = useState(false)

  const [editTarget, setEditTarget] = useState<
    | { type: "main"; projectId: string }
    | { type: "sub"; projectId: string; subId: string }
    | null
  >(null)

  const [currentParentForSub, setCurrentParentForSub] = useState<string | null>(
    null
  )

  const [newProjectName, setNewProjectName] = useState("")
  const [newSubProjectName, setNewSubProjectName] = useState("")
  const [editName, setEditName] = useState("")
  const [editStatus, setEditStatus] = useState<"نشط" | "مكتمل" | "مؤجل">("نشط")

  // حالة تبديل التنسيق
  const [showDetailedTime, setShowDetailedTime] = useState(false)

  // Loading states
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [isAddingSubProject, setIsAddingSubProject] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [subProjectSuccess, setSubProjectSuccess] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0)

  // حسّاسات السحب - must be called at top level
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  // Fetch projects from Sanity (with cache)
  const fetchProjects = useCallback(async () => {
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

      // console.log("=== PROJECTS DEBUG ===")
      // console.log("Projects count:", projectsData.length)
      // console.log("Projects data:", projectsData)
      // if (projectsData.length > 0) {
      //   console.log("First project structure:", {
      //     _id: projectsData[0]._id,
      //     name: projectsData[0].name,
      //     subProjects: projectsData[0].subProjects?.length || 0,
      //     subProjectIds: projectsData[0].subProjects?.map((sp: any) => sp._id) || [],
      //   })
      // }
      // console.log("=== END PROJECTS DEBUG ===")

      // Fetch sessions to calculate total time for each project
      const sessionsResponse = await fetch("/api/sessions")
      const sessionsResult = await sessionsResponse.json()

      if (sessionsResult.success) {
        const sessions = sessionsResult.data
        // console.log("=== SESSIONS DEBUG ===")
        // console.log("Sessions count:", sessions.length)
        // console.log("All sessions data:", sessions)
        // if (sessions.length > 0) {
        //   console.log("First session structure:", {
        //     _id: sessions[0]._id,
        //     hours: sessions[0].hours,
        //     minutes: sessions[0].minutes,
        //     project: sessions[0].project,
        //     projectRef: sessions[0].project?._ref,
        //     projectType: typeof sessions[0].project,
        //     projectKeys: sessions[0].project ? Object.keys(sessions[0].project) : null,
        //   })
        // }
        // console.log("=== END SESSIONS DEBUG ===")

        // Calculate total session time for each project
        const projectsWithSessionTime = projectsData.map((project: Project) => {
          // Get sessions that directly reference this project
          const directProjectSessions = sessions.filter(
            (session: {
              _id: string
              project?: { _id?: string; name?: string }
            }) => {
              // Handle both cases: when project is a reference object or when it's a full object
              const projectRef = session.project?._id
              // console.log(`Checking session ${session._id}: projectRef=${projectRef}, project._id=${project._id}`)
              return projectRef === project._id
            }
          )

          // Get sessions that reference this project's subprojects
          const subProjectSessions = sessions.filter(
            (session: {
              _id: string
              project?: { _id?: string; name?: string }
            }) => {
              const projectRef = session.project?._id
              if (!projectRef) {
                // console.log(`Session ${session._id} has no project reference`)
                return false
              }
              // Check if the session's project reference matches any of this project's subprojects
              const matches =
                project.subProjects?.some((subProject: { _id: string }) => {
                  const matches = subProject._id === projectRef
                  // if (matches) {
                  //   console.log(`Session ${session._id} matches subproject ${subProject._id}`)
                  // }
                  return matches
                }) || false
              return matches
            }
          )

          // Combine both types of sessions
          const allProjectSessions = [
            ...directProjectSessions,
            ...subProjectSessions,
          ]

          // console.log(`Project: ${project.name}`, {
          //   projectId: project._id,
          //   subProjectIds: project.subProjects?.map(
          //     (sp: { _id: string }) => sp._id
          //   ),
          //   directSessions: directProjectSessions.length,
          //   subProjectSessions: subProjectSessions.length,
          //   totalSessions: allProjectSessions.length,
          //   sessions: allProjectSessions.map((s) => ({
          //     id: s._id,
          //     hours: s.hours,
          //     minutes: s.minutes,
          //     projectRef: s.project?._ref,
          //     projectId: s.project?._id,
          //   })),
          //   allSessionsProjectRefs: sessions.map((s: any) => ({
          //     id: s._id,
          //     projectRef: s.project?._ref,
          //     projectId: s.project?._id,
          //   })),
          // })

          const totalSessionMinutes = allProjectSessions.reduce(
            (total: number, session: { hours: number; minutes: number }) => {
              return total + (session.hours * 60 + session.minutes)
            },
            0
          )

          const sessionTime = {
            hours: Math.floor(totalSessionMinutes / 60),
            minutes: totalSessionMinutes % 60,
          }

          // console.log(`Total session time for ${project.name}:`, sessionTime)

          return {
            ...project,
            totalSessionTime: sessionTime,
          }
        })

        setProjects(projectsWithSessionTime)
      } else {
        setProjects(projectsData)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }, [status, session?.user?.role, session?.user?.id])

  // Fetch projects from Sanity (without cache)
  const fetchProjectsNoCache = useCallback(async () => {
    if (status !== "authenticated") return

    try {
      // Fetch projects without cache using API endpoint
      const response = await fetch("/api/projects/no-cache")
      const result = await response.json()

      if (result.success) {
        const projectsData = result.data

        // Fetch sessions to calculate total time for each project
        const sessionsResponse = await fetch("/api/sessions")
        const sessionsResult = await sessionsResponse.json()

        if (sessionsResult.success) {
          const sessions = sessionsResult.data

          // Calculate total session time for each project
          const projectsWithSessionTime = projectsData.map(
            (project: Project) => {
              // Get sessions that directly reference this project
              const directProjectSessions = sessions.filter(
                (session: {
                  _id: string
                  project?: { _id?: string; name?: string }
                }) => {
                  // Handle both cases: when project is a reference object or when it's a full object
                  const projectRef = session.project?._id
                  return projectRef === project._id
                }
              )

              // Get sessions that reference this project's subprojects
              const subProjectSessions = sessions.filter(
                (session: {
                  _id: string
                  project?: { _id?: string; name?: string }
                }) => {
                  const projectRef = session.project?._id
                  if (!projectRef) {
                    return false
                  }
                  // Check if the session's project reference matches any of this project's subprojects
                  const matches =
                    project.subProjects?.some((subProject: { _id: string }) => {
                      const matches = subProject._id === projectRef
                      return matches
                    }) || false
                  return matches
                }
              )

              // Combine both types of sessions
              const allProjectSessions = [
                ...directProjectSessions,
                ...subProjectSessions,
              ]

              const totalSessionMinutes = allProjectSessions.reduce(
                (
                  total: number,
                  session: { hours: number; minutes: number }
                ) => {
                  return total + (session.hours * 60 + session.minutes)
                },
                0
              )

              const sessionTime = {
                hours: Math.floor(totalSessionMinutes / 60),
                minutes: totalSessionMinutes % 60,
              }

              return {
                ...project,
                totalSessionTime: sessionTime,
              }
            }
          )

          setProjects(projectsWithSessionTime)
        } else {
          setProjects(projectsData)
        }
      } else {
        console.error("Error fetching projects without cache:", result.error)
      }
    } catch (error) {
      console.error("Error fetching projects without cache:", error)
    }
  }, [status])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Debug: Log projects state changes
  useEffect(() => {
    console.log(
      "Projects state updated:",
      projects.map((p) => ({ id: p._id, name: p.name, status: p.status }))
    )
  }, [projects])

  // Listen for data updates to refresh projects
  useEffect(() => {
    const handleDataUpdate = () => {
      fetchProjects()
    }

    events.on(EVENTS.SESSIONS_UPDATED, handleDataUpdate)
    events.on(EVENTS.PROJECTS_UPDATED, handleDataUpdate)
    events.on(EVENTS.SUBPROJECTS_UPDATED, handleDataUpdate)

    return () => {
      events.off(EVENTS.SESSIONS_UPDATED, handleDataUpdate)
      events.off(EVENTS.PROJECTS_UPDATED, handleDataUpdate)
      events.off(EVENTS.SUBPROJECTS_UPDATED, handleDataUpdate)
    }
  }, [fetchProjects])

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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pid) => pid !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      if (deleteTarget.type === "main") {
        // Delete main project
        const response = await fetch(
          `/api/projects/${deleteTarget.projectId}`,
          {
            method: "DELETE",
          }
        )

        const result = await response.json()
        if (result.success) {
          // Remove from local state
          const newProjects = projects.filter(
            (p) => p._id !== deleteTarget.projectId
          )
          setProjects(newProjects)
          events.emit(EVENTS.PROJECTS_UPDATED)
        } else {
          console.error("Error deleting project:", result.error)
          return
        }
      } else {
        // Delete subproject
        const response = await fetch(`/api/subprojects/${deleteTarget.subId}`, {
          method: "DELETE",
        })

        const result = await response.json()
        if (result.success) {
          // Remove from local state
          const newProjects = projects.map((p) =>
            p._id === deleteTarget.projectId
              ? {
                  ...p,
                  subProjects: p.subProjects?.filter(
                    (sp) => sp._id !== deleteTarget.subId
                  ),
                }
              : p
          )
          setProjects(newProjects)
          events.emit(EVENTS.SUBPROJECTS_UPDATED)
        } else {
          console.error("Error deleting subproject:", result.error)
          return
        }
      }
      setDeleteTarget(null)
    } catch (error) {
      console.error("Error deleting:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const calcTotalTime = (
    subProjects?: Array<{ hours: number; minutes: number }>,
    sessionTime?: { hours?: number; minutes?: number }
  ) => {
    let totalMinutes = 0

    // Add subproject time
    if (subProjects && subProjects.length > 0) {
      totalMinutes += subProjects.reduce(
        (acc, sp) => acc + sp.hours * 60 + sp.minutes,
        0
      )
    }

    // Add session time
    if (sessionTime) {
      totalMinutes += (sessionTime.hours || 0) * 60 + (sessionTime.minutes || 0)
    }

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return { hours, minutes }
  }

  // دالة تحويل الوقت للتنسيق الجديد (بالإنجليزي)
  function formatTimeDetailed(hours: number, minutes: number) {
    const totalMinutes = hours * 60 + minutes
    if (totalMinutes < 24 * 60) {
      // أقل من 24 ساعة: عرض بالشكل العادي  "Xh Ym"
      return `${hours}h ${minutes}m`
    }

    let remainingMinutes = totalMinutes

    const weeks = Math.floor(remainingMinutes / (7 * 24 * 60))
    remainingMinutes -= weeks * 7 * 24 * 60

    const days = Math.floor(remainingMinutes / (24 * 60))
    remainingMinutes -= days * 24 * 60

    const hrs = Math.floor(remainingMinutes / 60)
    const mins = remainingMinutes % 60

    const parts = []
    if (weeks > 0) parts.push(`${weeks}w`)
    if (days > 0) parts.push(`${days}d`)
    if (hrs > 0) parts.push(`${hrs}h`)
    if (mins > 0) parts.push(`${mins}m`)
    if (parts.length === 0) return "0m"

    return parts.join(", ")
  }

  const onDragEnd = (event: {
    active: { id: string | number }
    over: { id: string | number } | null
  }) => {
    const { active, over } = event
    if (!over) return
    if (active.id === over.id) return

    const activeParent = String(active.id).split("-")[0]
    const overParent = String(over.id).split("-")[0]

    setProjects((prev) => {
      let newProjects = [...prev]

      if (!String(active.id).includes("-") && !String(over.id).includes("-")) {
        const oldIndex = newProjects.findIndex(
          (p) => p._id === String(active.id)
        )
        const newIndex = newProjects.findIndex((p) => p._id === String(over.id))
        newProjects = arrayMove(newProjects, oldIndex, newIndex)
      } else if (activeParent === overParent) {
        newProjects = newProjects.map((proj) => {
          if (proj._id === activeParent && proj.subProjects) {
            const oldIndex = proj.subProjects.findIndex(
              (sp) => sp._id === String(active.id)
            )
            const newIndex = proj.subProjects.findIndex(
              (sp) => sp._id === String(over.id)
            )
            if (oldIndex !== -1 && newIndex !== -1) {
              return {
                ...proj,
                subProjects: arrayMove(proj.subProjects, oldIndex, newIndex),
              }
            }
          }
          return proj
        })
      }
      return newProjects
    })
  }

  // fkkfmle
  // فتح حوار تعديل
  const openEditDialog = (
    type: "main" | "sub",
    projectId: string,
    subId?: string
  ) => {
    if (type === "main") {
      const proj = projects.find((p) => p._id === projectId)
      if (!proj) return
      setEditName(proj.name)
      setEditStatus(proj.status)
      setEditTarget({ type, projectId })
    } else {
      const proj = projects.find((p) => p._id === projectId)
      const sub = proj?.subProjects?.find((sp) => sp._id === subId)
      if (!sub) return
      setEditName(sub.name)
      setEditStatus(sub.status)
      setEditTarget({ type, projectId, subId: subId! })
    }
    setEditDialogOpen(true)
  }

  // حفظ تعديل المشروع أو الفرعي
  const saveEdit = async () => {
    if (!editTarget) return

    setIsEditing(true)
    try {
      if (editTarget.type === "main") {
        // Update main project
        const response = await fetch(`/api/projects/${editTarget.projectId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName,
            status: editStatus,
          }),
        })

        const result = await response.json()
        if (result.success) {
          console.log("Project update successful:", {
            editName,
            editStatus,
            projectId: editTarget.projectId,
          })

          // Update local state immediately using callback to ensure we have latest state
          setProjects((prevProjects) => {
            const newProjects = prevProjects.map((p) =>
              p._id === editTarget.projectId
                ? { ...p, name: editName, status: editStatus }
                : p
            )
            console.log(
              "Updated projects state:",
              newProjects.map((p) => ({ id: p._id, status: p.status }))
            )
            return newProjects
          })

          // Force a re-render immediately
          setForceUpdate((prev) => prev + 1)

          // Additional force update after a small delay
          setTimeout(() => {
            setForceUpdate((prev) => prev + 1)
          }, 50)

          events.emit(EVENTS.PROJECTS_UPDATED)
          setEditSuccess(true)
          setTimeout(() => setEditSuccess(false), 3000)
        } else {
          console.error("Error updating project:", result.error)
          return
        }
      } else {
        // Update subproject
        const response = await fetch(`/api/subprojects/${editTarget.subId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName,
            status: editStatus,
          }),
        })

        const result = await response.json()
        if (result.success) {
          console.log("Subproject update successful:", {
            editName,
            editStatus,
            subId: editTarget.subId,
          })

          // Update local state immediately using callback to ensure we have latest state
          setProjects((prevProjects) => {
            const newProjects = prevProjects.map((p) => {
              if (p._id === editTarget.projectId) {
                const newSubProjects = p.subProjects?.map((sp) =>
                  sp._id === editTarget.subId
                    ? { ...sp, name: editName, status: editStatus }
                    : sp
                )
                return { ...p, subProjects: newSubProjects }
              }
              return p
            })
            console.log(
              "Updated subprojects state:",
              newProjects.map((p) => ({
                id: p._id,
                subProjects: p.subProjects?.map((sp) => ({
                  id: sp._id,
                  status: sp.status,
                })),
              }))
            )
            return newProjects
          })

          // Force a re-render immediately
          setForceUpdate((prev) => prev + 1)

          // Additional force update after a small delay
          setTimeout(() => {
            setForceUpdate((prev) => prev + 1)
          }, 50)

          events.emit(EVENTS.SUBPROJECTS_UPDATED)
          setEditSuccess(true)
          setTimeout(() => setEditSuccess(false), 3000)
        } else {
          console.error("Error updating subproject:", result.error)
          return
        }
      }
      setEditDialogOpen(false)
    } catch (error) {
      console.error("Error saving edit:", error)
    } finally {
      setIsEditing(false)
    }
  }

  // حفظ مشروع جديد
  const saveNewProject = async () => {
    if (!newProjectName.trim()) return

    setIsAddingProject(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
          status: "نشط",
        }),
      })

      const result = await response.json()
      if (result.success) {
        // Add the new project to the current state immediately
        const newProject: Project = {
          _id: result.data._id,
          name: result.data.name,
          status: result.data.status,
          user: result.data.user,
          subProjects: [],
        }
        setProjects((prev) => [...prev, newProject])
        // Force refresh data
        await fetchProjects()
        events.emit(EVENTS.PROJECTS_UPDATED)
        setNewProjectName("")
        setAddProjectDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsAddingProject(false)
    }
  }

  // حفظ مشروع فرعي جديد
  const saveNewSubProject = async () => {
    if (!newSubProjectName.trim() || !currentParentForSub) return
    const parentProj = projects.find((p) => p._id === currentParentForSub)
    if (!parentProj) return

    setIsAddingSubProject(true)
    try {
      // Create a new subproject document
      const createResponse = await fetch("/api/subprojects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSubProjectName.trim(),
          status: "نشط",
          hours: 0,
          minutes: 0,
          projectId: parentProj._id,
        }),
      })

      const createResult = await createResponse.json()
      // console.log("Subproject creation result:", createResult)
      if (createResult.success) {
        // Immediately add the new subproject to the local state
        const newSubProject = {
          _id: createResult.data._id,
          name: createResult.data.name,
          status: createResult.data.status,
          hours: createResult.data.hours,
          minutes: createResult.data.minutes,
        }

        // console.log("Adding subproject to local state:", newSubProject)

        // Update the state with the new subproject
        setProjects((prev) => {
          const updated = prev.map((project) =>
            project._id === currentParentForSub
              ? {
                  ...project,
                  subProjects: [newSubProject, ...(project.subProjects || [])],
                }
              : project
          )
          // console.log("Updated projects state:", updated)
          return updated
        })

        // Also update the expanded state to ensure the project is visible
        setExpanded((prev) => {
          if (!prev.includes(parentProj._id)) {
            return [...prev, parentProj._id]
          }
          return prev
        })

        // Also refresh from database to ensure consistency (without cache)
        const retryFetch = async (retries = 3) => {
          for (let i = 0; i < retries; i++) {
            try {
              // Wait a bit for the database to be updated
              await new Promise((resolve) => setTimeout(resolve, 500 + i * 200))
              await fetchProjectsNoCache()
              // console.log(`Successfully refreshed projects on attempt ${i + 1}`)
              return
            } catch (error) {
              console.error(
                `Error refreshing projects after subproject creation (attempt ${i + 1}):`,
                error
              )
              if (i === retries - 1) {
                console.error("All retry attempts failed")
              }
            }
          }
        }

        retryFetch()

        // Force a re-render
        setForceUpdate((prev) => prev + 1)

        // Also try to fetch the specific project directly after a delay
        setTimeout(async () => {
          try {
            const response = await fetch(
              `/api/projects/${currentParentForSub}/no-cache`
            )
            const result = await response.json()

            if (result.success && result.data) {
              // console.log("Fetched updated project:", result.data)
              setProjects((prev) =>
                prev.map((project) =>
                  project._id === currentParentForSub
                    ? {
                        ...project,
                        subProjects: result.data.subProjects || [],
                      }
                    : project
                )
              )
            }
          } catch (error) {
            console.error("Error fetching specific project:", error)
          }
        }, 1000)

        events.emit(EVENTS.SUBPROJECTS_UPDATED)
        setNewSubProjectName("")
        setAddSubProjectDialogOpen(false)
        setCurrentParentForSub(null)
        setSubProjectSuccess(true)

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSubProjectSuccess(false)
        }, 3000)
      }
    } catch (error) {
      console.error("Error creating subproject:", error)
    } finally {
      setIsAddingSubProject(false)
    }
  }

  return (
    <div className="p-6 space-y-4 bg-red-0">
      <div className="flex justify-between items-center gap-4 "></div>

      {/* Success messages */}
      {subProjectSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">
            تم إضافة المشروع الفرعي بنجاح!
          </span>
        </div>
      )}

      {editSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">تم تحديث المشروع بنجاح!</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        {/* زر إضافة مشروع */}
        <Button
          onClick={() => setAddProjectDialogOpen(true)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          إضافة مشروع
        </Button>

        {/* زر الترس (Settings) */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSettingsDialogOpen(true)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Settings />
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          key={forceUpdate}
          items={projects.map((p) => p._id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => {
            const totalTime = calcTotalTime(
              project.subProjects,
              project.totalSessionTime
            )

            // Debug logging
            // console.log(`Project: ${project.name}`, {
            //   subProjects: project.subProjects?.length || 0,
            //   totalSessionTime: project.totalSessionTime,
            //   calculatedTime: totalTime,
            // })

            return (
              <SortableRow
                key={`${project._id}-${project.status}`}
                id={project._id}
              >
                <Card className="p-4 ">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(project._id)}
                  >
                    <div className="flex items-center gap-2 mr-[-10px]">
                      {expanded.includes(project._id) ? (
                        <ChevronDown />
                      ) : (
                        <ChevronRight />
                      )}
                      <span className="font-semibold ">{project.name}</span>
                    </div>

                    <Badge
                      className="ml-2"
                      variant={
                        project.status === "نشط"
                          ? "default"
                          : project.status === "مكتمل"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {project.status} {/* Debug: {project._id} */}
                    </Badge>

                    <div className="flex items-center bg-green-5 ml-[-15px]">
                      <span className="text-lg text-gray-500 whitespace-nowrap dark:text-white">
                        {showDetailedTime
                          ? formatTimeDetailed(
                              totalTime.hours,
                              totalTime.minutes
                            )
                          : `${totalTime.hours}h ${totalTime.minutes}m`}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              openEditDialog("main", project._id)
                            }}
                          >
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentParentForSub(project._id)
                              setAddSubProjectDialogOpen(true)
                            }}
                          >
                            إضافة مشروع فرعي
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeleteTarget({
                                type: "main",
                                projectId: project._id,
                              })
                            }}
                          >
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {expanded.includes(project._id) && (
                    <SortableContext
                      items={project.subProjects?.map((sp) => sp._id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className=" pt-4 space-y-2">
                        {(project.subProjects?.length === 0 ||
                          !project.subProjects) && <p>لا يوجد مشاريع فرعية.</p>}
                        {project.subProjects?.map((subProject) => (
                          <SortableRow
                            key={`${subProject._id}-${subProject.status}`}
                            id={subProject._id}
                          >
                            <Card
                              className="p-4 pt-2 pb-2 dark:border-gray-700 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between gap-2 pr-2">
                                <div className="flex items-center gap-2 mr-[-10px]">
                                  <span>{subProject.name}</span>
                                </div>
                                <Badge
                                  className="ml-2"
                                  variant={
                                    subProject.status === "نشط"
                                      ? "default"
                                      : subProject.status === "مكتمل"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {subProject.status}
                                </Badge>

                                <div className="flex items-center bg-green-5 ml-[-15px]">
                                  <span className="text-lg text-gray-500 whitespace-nowrap dark:text-white">
                                    {showDetailedTime
                                      ? formatTimeDetailed(
                                          subProject.hours,
                                          subProject.minutes
                                        )
                                      : `${subProject.hours}h ${subProject.minutes}m`}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          openEditDialog(
                                            "sub",
                                            project._id,
                                            subProject._id
                                          )
                                        }}
                                      >
                                        تعديل
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setDeleteTarget({
                                            type: "sub",
                                            projectId: project._id,
                                            subId: subProject._id,
                                          })
                                        }}
                                      >
                                        حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </Card>
                          </SortableRow>
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </Card>
              </SortableRow>
            )
          })}
        </SortableContext>
      </DndContext>

      {/* حوارات الحذف والإضافة والتعديل كما هي */}
      {/* ... نفس الكود للحوارات ... */}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>هل أنت متأكد من الحذف؟</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  حذف...
                </div>
              ) : (
                "حذف"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addProjectDialogOpen}
        onOpenChange={setAddProjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مشروع جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="اسم المشروع"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAddProjectDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={saveNewProject} disabled={isAddingProject}>
              {isAddingProject ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  إضافة...
                </div>
              ) : (
                "حفظ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addSubProjectDialogOpen}
        onOpenChange={setAddSubProjectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مشروع فرعي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="اسم المشروع الفرعي"
              value={newSubProjectName}
              onChange={(e) => setNewSubProjectName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAddSubProjectDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={saveNewSubProject} disabled={isAddingSubProject}>
              {isAddingSubProject ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  إضافة...
                </div>
              ) : (
                "حفظ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المشروع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="الاسم"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
            <select
              value={editStatus}
              onChange={(e) =>
                setEditStatus(e.target.value as "نشط" | "مكتمل" | "مؤجل")
              }
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="نشط">نشط</option>
              <option value="مكتمل">مكتمل</option>
              <option value="مؤجل">مؤجل</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setEditDialogOpen(false)}
              disabled={isEditing}
            >
              إلغاء
            </Button>
            <Button onClick={saveEdit} disabled={isEditing}>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  حفظ...
                </div>
              ) : (
                "حفظ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إعدادات عرض الوقت</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between py-4">
            <span>عرض الوقت بتنسيق ذكي</span>

            <Switch
              checked={showDetailedTime}
              onCheckedChange={() => setShowDetailedTime((prev) => !prev)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSettingsDialogOpen(false)}
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
