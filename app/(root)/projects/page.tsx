"use client";

import { useState } from "react";
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

type Project = {
  id: string;
  name: string;
  status: "نشط" | "مكتمل" | "مؤجل";
  subProjects: SubProject[];
};
type SubProject = {
  id: string;
  name: string;
  status: "نشط" | "مكتمل" | "مؤجل";
  hours: number;
  minutes: number;
};

export default function ProjectsPage() {
  // تحميل المشاريع
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("projects");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "1",
        name: "مشروع متجر إلكتروني",
        status: "نشط",
        subProjects: [
          {
            id: "1-1",
            name: "تصميم الواجهة",
            status: "نشط",
            hours: 351,
            minutes: 30,
          },
          {
            id: "1-2",
            name: "برمجة السلة",
            status: "مكتمل",
            hours: 3,
            minutes: 0,
          },
        ],
      },
      {
        id: "2",
        name: "مشروع تطبيق جوال",
        status: "مكتمل",
        subProjects: [
          {
            id: "2-1",
            name: "الشاشة الرئيسية",
            status: "مكتمل",
            hours: 4,
            minutes: 0,
          },
        ],
      },
      { id: "3", name: "مشروع لوحة تحكم", status: "نشط", subProjects: [] },
    ];
  });

  const [expanded, setExpanded] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("expanded");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "main" | "sub";
    projectId: string;
    subId?: string;
  } | null>(null);

  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addSubProjectDialogOpen, setAddSubProjectDialogOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<
    | { type: "main"; projectId: string }
    | { type: "sub"; projectId: string; subId: string }
    | null
  >(null);

  const [currentParentForSub, setCurrentParentForSub] = useState<string | null>(
    null
  );

  const [newProjectName, setNewProjectName] = useState("");
  const [newSubProjectName, setNewSubProjectName] = useState("");
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"نشط" | "مكتمل" | "مؤجل">("نشط");

  // حالة تبديل التنسيق
  const [showDetailedTime, setShowDetailedTime] = useState(false);

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
      localStorage.setItem("expanded", JSON.stringify(newExpanded));
      return newExpanded;
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "main") {
      const newProjects = projects.filter(
        (p) => p.id !== deleteTarget.projectId
      );
      setProjects(newProjects);
      localStorage.setItem("projects", JSON.stringify(newProjects));
    } else {
      const newProjects = projects.map((p) =>
        p.id === deleteTarget.projectId
          ? {
              ...p,
              subProjects: p.subProjects.filter(
                (sp) => sp.id !== deleteTarget.subId
              ),
            }
          : p
      );
      setProjects(newProjects);
      localStorage.setItem("projects", JSON.stringify(newProjects));
    }
    setDeleteTarget(null);
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
        const oldIndex = newProjects.findIndex((p) => p.id === active.id);
        const newIndex = newProjects.findIndex((p) => p.id === over.id);
        newProjects = arrayMove(newProjects, oldIndex, newIndex);
      } else if (activeParent === overParent) {
        newProjects = newProjects.map((proj) => {
          if (proj.id === activeParent) {
            const oldIndex = proj.subProjects.findIndex(
              (sp) => sp.id === active.id
            );
            const newIndex = proj.subProjects.findIndex(
              (sp) => sp.id === over.id
            );
            return {
              ...proj,
              subProjects: arrayMove(proj.subProjects, oldIndex, newIndex),
            };
          }
          return proj;
        });
      }
      localStorage.setItem("projects", JSON.stringify(newProjects));
      return newProjects;
    });
  };

  // fkkfmle
  // فتح حوار تعديل
  const openEditDialog = (
    type: "main" | "sub",
    projectId: string,
    subId?: string
  ) => {
    if (type === "main") {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) return;
      setEditName(proj.name);
      setEditStatus(proj.status);
      setEditTarget({ type, projectId });
    } else {
      const proj = projects.find((p) => p.id === projectId);
      const sub = proj?.subProjects.find((sp) => sp.id === subId);
      if (!sub) return;
      setEditName(sub.name);
      setEditStatus(sub.status);
      setEditTarget({ type, projectId, subId: subId! });
    }
    setEditDialogOpen(true);
  };

  // حفظ تعديل المشروع أو الفرعي
  const saveEdit = () => {
    if (!editTarget) return;
    if (editTarget.type === "main") {
      const newProjects = projects.map((p) =>
        p.id === editTarget.projectId
          ? { ...p, name: editName, status: editStatus }
          : p
      );
      setProjects(newProjects);
      localStorage.setItem("projects", JSON.stringify(newProjects));
    } else {
      const newProjects = projects.map((p) => {
        if (p.id === editTarget.projectId) {
          const newSubProjects = p.subProjects.map((sp) =>
            sp.id === editTarget.subId
              ? { ...sp, name: editName, status: editStatus }
              : sp
          );
          return { ...p, subProjects: newSubProjects };
        }
        return p;
      });
      setProjects(newProjects);
      localStorage.setItem("projects", JSON.stringify(newProjects));
    }
    setEditDialogOpen(false);
  };

  // حفظ مشروع جديد
  const saveNewProject = () => {
    if (!newProjectName.trim()) return;
    const newId = (
      Math.max(0, ...projects.map((p) => Number(p.id))) + 1
    ).toString();
    const newProj: Project = {
      id: newId,
      name: newProjectName.trim(),
      status: "نشط",
      subProjects: [],
    };
    const newProjects = [...projects, newProj];
    setProjects(newProjects);
    localStorage.setItem("projects", JSON.stringify(newProjects));
    setNewProjectName("");
    setAddProjectDialogOpen(false);
  };

  // حفظ مشروع فرعي جديد
  const saveNewSubProject = () => {
    if (!newSubProjectName.trim() || !currentParentForSub) return;
    const parentProj = projects.find((p) => p.id === currentParentForSub);
    if (!parentProj) return;

    const existingIds = parentProj.subProjects.map((sp) => sp.id);
    let maxSubNum = 0;
    existingIds.forEach((id) => {
      const parts = id.split("-");
      const num = Number(parts[1]);
      if (num > maxSubNum) maxSubNum = num;
    });
    const newSubId = `${parentProj.id}-${maxSubNum + 1}`;

    const newSub: SubProject = {
      id: newSubId,
      name: newSubProjectName.trim(),
      status: "نشط",
      hours: 0,
      minutes: 0,
    };
    const newProjects = projects.map((p) =>
      p.id === parentProj.id
        ? { ...p, subProjects: [...p.subProjects, newSub] }
        : p
    );
    setProjects(newProjects);
    localStorage.setItem("projects", JSON.stringify(newProjects));
    setNewSubProjectName("");
    setAddSubProjectDialogOpen(false);
    setCurrentParentForSub(null);
    setExpanded((prev) => {
      if (!prev.includes(parentProj.id)) {
        const newExpanded = [...prev, parentProj.id];
        localStorage.setItem("expanded", JSON.stringify(newExpanded));
        return newExpanded;
      }
      return prev;
    });
  };

  return (
    <div className="p-6 space-y-4 bg-red-0  ">
      <div className="flex justify-between items-center gap-4 "></div>

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
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => {
            const totalTime = calcTotalTime(project.subProjects);
            return (
              <SortableRow key={project.id} id={project.id}>
                <Card className="p-4 ">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(project.id)}
                  >
                    <div className="flex items-center gap-2 mr-[-10px]">
                      {expanded.includes(project.id) ? (
                        <ChevronDown />
                      ) : (
                        <ChevronRight />
                      )}
                      <span className="font-semibold ">
                        {project.name}
                      </span>
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
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => {
                              openEditDialog("main", project.id);
                            }}
                          >
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setCurrentParentForSub(project.id);
                              setAddSubProjectDialogOpen(true);
                            }}
                          >
                            إضافة مشروع فرعي
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeleteTarget({
                                type: "main",
                                projectId: project.id,
                              });
                            }}
                          >
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {expanded.includes(project.id) && (
                    <SortableContext
                      items={project.subProjects.map((sp) => sp.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className=" pt-4 space-y-2">
                        {project.subProjects.length === 0 && (
                          <p>لا يوجد مشاريع فرعية.</p>
                        )}
                        {project.subProjects.map((subProject) => (
                          <SortableRow key={subProject.id} id={subProject.id}>
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
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          openEditDialog(
                                            "sub",
                                            project.id,
                                            subProject.id
                                          );
                                        }}
                                      >
                                        تعديل
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setDeleteTarget({
                                            type: "sub",
                                            projectId: project.id,
                                            subId: subProject.id,
                                          });
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
            );
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
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف
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
            <Button onClick={saveNewProject}>حفظ</Button>
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
            <Button onClick={saveNewSubProject}>حفظ</Button>
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
              onChange={(e) => setEditStatus(e.target.value as "نشط" | "مكتمل" | "مؤجل")}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="نشط">نشط</option>
              <option value="مكتمل">مكتمل</option>
              <option value="مؤجل">مؤجل</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={saveEdit}>حفظ</Button>
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
  );
}
