"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Settings,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSession } from "next-auth/react";

import { sanityClient } from "@/sanity/lib/client";
import { USER_QUERY } from "@/sanity/lib/queries";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaSpinner } from "react-icons/fa";

type Session = {
  _id: string;
  hours: string;
  minutes: string;
};

type SubProject = {
  _id: string;
  name: string;
  status: "نشط" | "مكتمل" | "مؤجل";
  sessions: Session[];
};

type Project = {
  _id: string;
  name: string;
  status: "نشط" | "مكتمل" | "مؤجل";
  sessions: Session[];
  subProjects: SubProject[];
};

function SortableItem({ id, children, data }: { id: string; children: React.ReactNode; data?: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, data });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showDetailedTime, setShowDetailedTime] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [addSubProjectDialogOpen, setAddSubProjectDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Data for dialogs
  const [newProjectName, setNewProjectName] = useState("");
  const [newSubProjectName, setNewSubProjectName] = useState("");
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"نشط" | "مكتمل" | "مؤجل">("نشط");

  // Target for actions
  const [currentParentForSub, setCurrentParentForSub] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<{ type: "main"; projectId: string } | { type: "sub"; projectId: string; subId: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "main" | "sub"; projectId: string; subId?: string } | null>(null);

  const fetchProjects = useCallback(async () => {
    if (status === "authenticated" && session?.user?.id) {
      const data = await sanityClient.fetch(USER_QUERY, { userId: session.user.id });
      if (data?.projects) {
        const savedProjectsOrder = localStorage.getItem(`projects_order_${session.user.id}`);
        const savedSubProjectsOrder = localStorage.getItem(`sub_projects_order_${session.user.id}`);

        let projectsToSet = data.projects;

        if (savedProjectsOrder) {
          const orderedProjects = JSON.parse(savedProjectsOrder).map((id: string) => projectsToSet.find((p: Project) => p._id === id)).filter(Boolean);
          const remainingProjects = projectsToSet.filter((p: Project) => !JSON.parse(savedProjectsOrder).includes(p._id));
          projectsToSet = [...orderedProjects, ...remainingProjects];
        }

        if (savedSubProjectsOrder) {
          const subProjectsOrder = JSON.parse(savedSubProjectsOrder);
          projectsToSet = projectsToSet.map((p: Project) => {
            if (subProjectsOrder[p._id]) {
              const orderedSubProjects = subProjectsOrder[p._id].map((id: string) => p.subProjects.find((sp: SubProject) => sp._id === id)).filter(Boolean);
              const remainingSubProjects = p.subProjects.filter((sp: SubProject) => !subProjectsOrder[p._id].includes(sp._id));
              return { ...p, subProjects: [...orderedSubProjects, ...remainingSubProjects] };
            }
            return p;
          });
        }

        setProjects(projectsToSet);
        setUserData(data);
      }
    }
  }, [status, session?.user?.id]);

  const handleAddProject = async () => {
    if (!newProjectName.trim() || !session?.user?.id) return;
    setIsLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName, status: "نشط", userId: session.user.id }),
    });
    setNewProjectName("");
    setAddProjectDialogOpen(false);
    await fetchProjects();
    setIsLoading(false);
  };

  const handleAddSubProject = async () => {
    if (!newSubProjectName.trim() || !currentParentForSub) return;
    setIsLoading(true);
    await fetch("/api/subprojects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubProjectName, status: "نشط", projectId: currentParentForSub }),
    });
    setNewSubProjectName("");
    setAddSubProjectDialogOpen(false);
    await fetchProjects();
    setIsLoading(false);
  };

  const handleEditProject = async () => {
    if (!editTarget) return;
    setIsLoading(true);
    let url;
    if (editTarget.type === 'main') {
      url = `/api/projects/${editTarget.projectId}`;
    } else {
      url = `/api/subprojects/${editTarget.subId}`;
    }
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, status: editStatus }),
    });
    setEditDialogOpen(false);
    await fetchProjects();
    setIsLoading(false);
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    setIsLoading(true);
    let url;
    if (deleteTarget.type === 'main') {
      url = `/api/projects/${deleteTarget.projectId}`;
    } else {
      url = `/api/subprojects/${deleteTarget.subId}`;
    }
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) {
      setDeleteTarget(null);
      setDeleteDialogOpen(false);
      await fetchProjects();
    }
    setIsLoading(false);
  };

  const openEditDialog = (type: "main" | "sub", projectId: string, subId?: string) => {
    if (type === "main") {
      const proj = projects.find((p) => p._id === projectId);
      if (!proj) return;
      setEditName(proj.name);
      setEditStatus(proj.status);
      setEditTarget({ type, projectId });
    } else {
      const proj = projects.find((p) => p._id === projectId);
      const sub = proj?.subProjects.find((sp) => sp._id === subId);
      if (!sub) return;
      setEditName(sub.name);
      setEditStatus(sub.status);
      setEditTarget({ type, projectId, subId: subId! });
    }
    setEditDialogOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const savedExpanded = localStorage.getItem(`expanded_projects_${session?.user?.id}`);
    if (savedExpanded) {
      setExpanded(JSON.parse(savedExpanded));
    }
    fetchProjects();
  }, [fetchProjects, session?.user?.id]);

  useEffect(() => {
    if (projects.length > 0 && session?.user?.id) {
      const projectsOrder = projects.map(p => p._id);
      const subProjectsOrder = projects.reduce((acc, p) => {
        acc[p._id] = p.subProjects.map(sp => sp._id);
        return acc;
      }, {} as Record<string, string[]>);

      localStorage.setItem(`projects_order_${session.user.id}`, JSON.stringify(projectsOrder));
      localStorage.setItem(`sub_projects_order_${session.user.id}`, JSON.stringify(subProjectsOrder));
    }
  }, [projects, session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      localStorage.setItem(`expanded_projects_${session.user.id}`, JSON.stringify(expanded));
    }
  }, [expanded, session?.user?.id]);

  useEffect(() => {
    const savedShowDetailedTime = localStorage.getItem("showDetailedTime");
    if (savedShowDetailedTime) {
      setShowDetailedTime(JSON.parse(savedShowDetailedTime));
    }
  }, []);

  

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    setProjects((currentProjects) => {
      if (activeType === 'project' && overType === 'project') {
        const oldIndex = currentProjects.findIndex((p) => p._id === active.id);
        const newIndex = currentProjects.findIndex((p) => p._id === over.id);
        return arrayMove(currentProjects, oldIndex, newIndex);
      } 
      
      if (activeType === 'subProject' && overType === 'subProject') {
        const activeParentId = active.data.current?.parentId;
        const overParentId = over.data.current?.parentId;

        if (activeParentId === overParentId) {
          return currentProjects.map((p) => {
            if (p._id === activeParentId) {
              const oldIndex = p.subProjects.findIndex((sp) => sp._id === active.id);
              const newIndex = p.subProjects.findIndex((sp) => sp._id === over.id);
              const reorderedSubProjects = arrayMove(p.subProjects, oldIndex, newIndex);
              return { ...p, subProjects: reorderedSubProjects };
            }
            return p;
          });
        }
      }
      return currentProjects;
    });
  };

  
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      let newExpanded;
      if (prev.includes(id)) newExpanded = prev.filter((pid) => pid !== id);
      else newExpanded = [...prev, id];
      return newExpanded;
    });
  };

  const calculateSessionTime = (sessions: Session[]) => {
    if (!sessions) return { hours: 0, minutes: 0 };
    const totalMinutes = sessions.reduce(
      (acc, session) =>
        acc + (Number(session.hours) || 0) * 60 + (Number(session.minutes) || 0),
      0
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  const calcTotalTime = (project: Project) => {
    let totalMinutes = 0;
    if (project.sessions) {
      const projectTime = calculateSessionTime(project.sessions);
      totalMinutes += projectTime.hours * 60 + projectTime.minutes;
    }
    if (project.subProjects) {
      project.subProjects.forEach((sp) => {
        if (sp.sessions) {
          const subProjectTime = calculateSessionTime(sp.sessions);
          totalMinutes += subProjectTime.hours * 60 + subProjectTime.minutes;
        }
      });
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };

    function formatTimeDetailed(hours: number, minutes: number) {
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes === 0) return "0m";

    const minutesInHour = 60;
    const minutesInDay = 24 * minutesInHour;
    const minutesInWeek = 7 * minutesInDay;
    const minutesInMonth = 30 * minutesInDay;
    const minutesInYear = 12 * minutesInMonth;

    let remainingMinutes = totalMinutes;
    const parts = [];

    const years = Math.floor(remainingMinutes / minutesInYear);
    if (years > 0) {
      parts.push(`${years}y`);
      remainingMinutes %= minutesInYear;
    }

    const months = Math.floor(remainingMinutes / minutesInMonth);
    if (months > 0) {
      parts.push(`${months}mo`);
      remainingMinutes %= minutesInMonth;
    }

    const weeks = Math.floor(remainingMinutes / minutesInWeek);
    if (weeks > 0) {
      parts.push(`${weeks}w`);
      remainingMinutes %= minutesInWeek;
    }

    const days = Math.floor(remainingMinutes / minutesInDay);
    if (days > 0) {
      parts.push(`${days}d`);
      remainingMinutes %= minutesInDay;
    }

    const hrs = Math.floor(remainingMinutes / minutesInHour);
    if (hrs > 0) {
      parts.push(`${hrs}h`);
      remainingMinutes %= minutesInHour;
    }

    const mins = Math.floor(remainingMinutes);
    if (mins > 0) {
      parts.push(`${mins}m`);
    }

    return parts.join(", ");
  }

  const formatSimpleTime = (hours: number, minutes: number) => {
    if (hours === 0 && minutes === 0) return "0m";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours.toLocaleString()}h`;
    return `${hours.toLocaleString()}h ${minutes}m`;
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-6 space-y-4 bg-red-0">
        <div className="flex justify-between items-center mt-5 mb-5">
          <Button onClick={() => setAddProjectDialogOpen(true)}>إضافة مشروع</Button>
          <Button size="icon" variant="ghost" onClick={() => setSettingsDialogOpen(true)} onPointerDown={(e) => e.stopPropagation()}>
            <Settings />
          </Button>
        </div>
        <SortableContext items={projects.map((p) => p._id)} strategy={verticalListSortingStrategy}>
          {projects.map((project) => {
            const totalTime = calcTotalTime(project);
            const subProjectsTime = project.subProjects.map((sp) => calculateSessionTime(sp.sessions));
            return (
              <SortableItem key={project._id} id={project._id} data={{ type: 'project' }}>
                <Card className="p-4 ">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(project._id)}>
                    <div className="flex items-center gap-2 mr-[-10px]">
                      {expanded.includes(project._id) ? <ChevronDown /> : <ChevronRight />}
                      <span className="font-semibold ">{project.name}</span>
                    </div>
                    <Badge className="ml-2" variant={project.status === "نشط" ? "default" : project.status === "مكتمل" ? "secondary" : "destructive"}>
                      {project.status}
                    </Badge>
                    <div className="flex items-center bg-green-5 ml-[-15px]">
                      <span className={`${(showDetailedTime && (formatTimeDetailed(totalTime.hours, totalTime.minutes).includes('y') || formatTimeDetailed(totalTime.hours, totalTime.minutes).includes('mo'))) ? 'text-[13px]' : 'text-lg'} text-gray-500 whitespace-nowrap dark:text-white`}>
                        {showDetailedTime ? formatTimeDetailed(totalTime.hours, totalTime.minutes) : formatSimpleTime(totalTime.hours, totalTime.minutes)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => openEditDialog("main", project._id)}>تعديل</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setCurrentParentForSub(project._id); setAddSubProjectDialogOpen(true); }}>إضافة مشروع فرعي</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setDeleteTarget({ type: "main", projectId: project._id }); setDeleteDialogOpen(true); }}>حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {expanded.includes(project._id) && (
                    <div className=" pt-4 space-y-2">
                      {project.subProjects.length === 0 && <p>لا يوجد مشاريع فرعية.</p>}
                      <SortableContext items={project.subProjects.map((sp) => sp._id)} strategy={verticalListSortingStrategy}>
                        {project.subProjects.map((subProject, index) => {
                          const subProjectTime = subProjectsTime[index];
                          return (
                            <SortableItem key={subProject._id} id={subProject._id} data={{ type: 'subProject', parentId: project._id }}>
                              <Card className="p-4 pt-2 pb-2 dark:border-gray-700 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between gap-2 ">
                                  
                                  <div className="flex items-center gap-2 mr-[-10px]">
                                    <span>{subProject.name}</span>
                                  </div>

                                  <Badge className="ml-2" variant={subProject.status === "نشط" ? "default" : subProject.status === "مكتمل" ? "secondary" : "destructive"}>
                                    {subProject.status}
                                  </Badge>

                                  <div className="flex items-center bg-green-5 ml-[-15px]">
                                    <span className={`${(showDetailedTime && (formatTimeDetailed(subProjectTime.hours, subProjectTime.minutes).includes('w') || formatTimeDetailed(subProjectTime.hours, subProjectTime.minutes).includes('mo') || formatTimeDetailed(subProjectTime.hours, subProjectTime.minutes).includes('y'))) ? 'text-[15px]' : 'text-[17px] whitespace-nowrap'} text-left  text-gray-500 dark:text-white`}>
                                      {showDetailedTime ? formatTimeDetailed(subProjectTime.hours, subProjectTime.minutes) : `${subProjectTime.hours.toLocaleString()}h ${subProjectTime.minutes}m`}
                                    </span>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                          <MoreVertical />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => openEditDialog("sub", project._id, subProject._id)}>تعديل</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => { setDeleteTarget({ type: "sub", projectId: project._id, subId: subProject._id }); setDeleteDialogOpen(true); }}>حذف</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                </div>
                              </Card>
                            </SortableItem>
                          );
                        })}
                      </SortableContext>
                    </div>
                  )}
                </Card>
              </SortableItem>
            );
          })}
        </SortableContext>
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إعدادات عرض الوقت</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-between py-4">
              <span>عرض الوقت بتنسيق ذكي</span>
              <Switch
                checked={showDetailedTime}
                onCheckedChange={(value) => {
                  setShowDetailedTime(value);
                  localStorage.setItem("showDetailedTime", JSON.stringify(value));
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSettingsDialogOpen(false)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Project Dialog */}
        <Dialog open={addProjectDialogOpen} onOpenChange={setAddProjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مشروع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input type="text" placeholder="اسم المشروع" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddProjectDialogOpen(false)} disabled={isLoading}>إلغاء</Button>
              <Button onClick={handleAddProject} disabled={isLoading}>
                {isLoading ? <FaSpinner className="animate-spin" /> : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Sub-Project Dialog */}
        <Dialog open={addSubProjectDialogOpen} onOpenChange={setAddSubProjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مشروع فرعي</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input type="text" placeholder="اسم المشروع الفرعي" value={newSubProjectName} onChange={(e) => setNewSubProjectName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddSubProjectDialogOpen(false)} disabled={isLoading}>إلغاء</Button>
              <Button onClick={handleAddSubProject} disabled={isLoading}>
                {isLoading ? <FaSpinner className="animate-spin" /> : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل المشروع</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input type="text" placeholder="الاسم" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <Select value={editStatus} onValueChange={(value) => setEditStatus(value as "نشط" | "مكتمل" | "مؤجل")}>
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="مكتمل">مكتمل</SelectItem>
                  <SelectItem value="مؤجل">مؤجل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditDialogOpen(false)} disabled={isLoading}>إلغاء</Button>
              <Button onClick={handleEditProject} disabled={isLoading}>
                {isLoading ? <FaSpinner className="animate-spin" /> : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>هل أنت متأكد من الحذف؟</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={isLoading}>إلغاء</Button>
              <Button variant="destructive" onClick={handleDeleteProject} disabled={isLoading}>
                {isLoading ? <FaSpinner className="animate-spin" /> : "حذف"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}
