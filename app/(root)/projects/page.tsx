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

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Switch } from "@/components/ui/switch";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { sanityClient } from "@/sanity/lib/client";
import { USER_QUERY } from "@/sanity/lib/queries";

/* --- SortableRow --- */
function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
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

type SubProject = {
  _id: string;
  name: string;
  status: "نشط" | "مكتمل" | "مؤجل";
  hours: number;
  minutes: number;
};

type Project = {
  _id: string;
  name: string;
  status: "نشط" | "مكتمل" | "مؤجل";
  subProjects: SubProject[];
};

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showDetailedTime, setShowDetailedTime] = useState(false);

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      sanityClient
        .fetch(USER_QUERY, { userId: session.user.id })
        .then((data) => {
          setUserData(data);
          setProjects(data?.projects || []);
        });
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

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

  // حسّاسات السحب
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      let newExpanded;
      if (prev.includes(id)) newExpanded = prev.filter((pid) => pid !== id);
      else newExpanded = [...prev, id];
      return newExpanded;
    });
  };

  const calcTotalTime = (subProjects: SubProject[]) => {
    let totalMinutes = subProjects.reduce(
      (acc, sp) => acc + sp.hours * 60 + sp.minutes,
      0
    );
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  // دالة تحويل الوقت للتنسيق الجديد (بالإنجليزي)
  function formatTimeDetailed(hours: number, minutes: number) {
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 24 * 60) {
      // أقل من 24 ساعة: عرض بالشكل العادي  "Xh Ym"
      return `${hours}h ${minutes}m`;
    }

    let remainingMinutes = totalMinutes;

    const weeks = Math.floor(remainingMinutes / (7 * 24 * 60));
    remainingMinutes -= weeks * 7 * 24 * 60;

    const days = Math.floor(remainingMinutes / (24 * 60));
    remainingMinutes -= days * 24 * 60;

    const hrs = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;

    let parts = [];
    if (weeks > 0) parts.push(`${weeks}w`);
    if (days > 0) parts.push(`${days}d`);
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0) parts.push(`${mins}m`);
    if (parts.length === 0) return "0m";

    return parts.join(", ");
  }

  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeParent = active.id.split("-")[0];
    const overParent = over.id.split("-")[0];

    setProjects((prev) => {
      let newProjects = [...prev];

      if (!active.id.includes("-") && !over.id.includes("-")) {
        const oldIndex = newProjects.findIndex((p) => p._id === active.id);
        const newIndex = newProjects.findIndex((p) => p._id === over.id);
        newProjects = arrayMove(newProjects, oldIndex, newIndex);
      } else if (activeParent === overParent) {
        newProjects = newProjects.map((proj) => {
          if (proj._id === activeParent) {
            const oldIndex = proj.subProjects.findIndex(
              (sp) => sp._id === active.id
            );
            const newIndex = proj.subProjects.findIndex(
              (sp) => sp._id === over.id
            );
            return {
              ...proj,
              subProjects: arrayMove(proj.subProjects, oldIndex, newIndex),
            };
          }
          return proj;
        });
      }
      return newProjects;
    });
  };

  return (
    <div className="p-6 space-y-4 bg-red-0">
      <div className="flex justify-between items-center gap-4 "></div>

      <div className="flex justify-end items-center">
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
          items={projects.map((p) => p._id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => {
            const totalTime = calcTotalTime(project.subProjects);
            return (
              <SortableRow key={project._id} id={project._id}>
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
                      {project.status}
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
                        <DropdownMenuContent></DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {expanded.includes(project._id) && (
                    <SortableContext
                      items={project.subProjects.map((sp) => sp._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className=" pt-4 space-y-2">
                        {project.subProjects.length === 0 && (
                          <p>لا يوجد مشاريع فرعية.</p>
                        )}
                        {project.subProjects.map((subProject) => (
                          <SortableRow key={subProject._id} id={subProject._id}>
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
                                        : "outline"
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
                                    <DropdownMenuContent></DropdownMenuContent>
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
            );
          })}
        </SortableContext>
      </DndContext>

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
  );
}
