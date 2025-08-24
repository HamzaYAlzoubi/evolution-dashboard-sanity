"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showDetailedTime, setShowDetailedTime] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      sanityClient.fetch(USER_QUERY, { userId: session.user.id }).then((data) => {
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
      });
    }
  }, [status, session?.user?.id]);

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
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

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
    let parts = [];
    const weeks = Math.floor(totalMinutes / (7 * 24 * 60));
    let remainingMinutes = totalMinutes % (7 * 24 * 60);
    const days = Math.floor(remainingMinutes / (24 * 60));
    remainingMinutes %= 24 * 60;
    const hrs = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    if (weeks > 0) parts.push(`${weeks}w`);
    if (days > 0) parts.push(`${days}d`);
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    return parts.join(", ");
  }

  const formatSimpleTime = (hours: number, minutes: number) => {
    if (hours === 0 && minutes === 0) return "0m";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-6 space-y-4 bg-red-0">
        <div className="flex justify-between items-center gap-4 "></div>
        <div className="flex justify-end items-center">
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
                      <span className="text-lg text-gray-500 whitespace-nowrap dark:text-white">
                        {showDetailedTime ? formatTimeDetailed(totalTime.hours, totalTime.minutes) : formatSimpleTime(totalTime.hours, totalTime.minutes)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent></DropdownMenuContent>
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
                                <div className="flex items-center justify-between gap-2 pr-2">
                                  <div className="flex items-center gap-2 mr-[-10px]">
                                    <span>{subProject.name}</span>
                                  </div>
                                  <Badge className="ml-2" variant={subProject.status === "نشط" ? "default" : subProject.status === "مكتمل" ? "secondary" : "outline"}>
                                    {subProject.status}
                                  </Badge>
                                  <div className="flex items-center bg-green-5 ml-[-15px]">
                                    <span className="text-lg text-gray-500 whitespace-nowrap dark:text-white">
                                      {showDetailedTime ? formatTimeDetailed(subProjectTime.hours, subProjectTime.minutes) : `${subProjectTime.hours}h ${subProjectTime.minutes}m`}
                                    </span>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                          <MoreVertical />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent></DropdownMenuContent>
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
              <Switch checked={showDetailedTime} onCheckedChange={() => setShowDetailedTime((prev) => !prev)} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSettingsDialogOpen(false)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}
