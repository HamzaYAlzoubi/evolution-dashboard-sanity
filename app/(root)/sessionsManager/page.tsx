"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Project = {
  id: string;
  name: string;
  subProjects?: { id: string; name: string }[];
};

type Session = {
  id: string;
  projectId?: string;
  projectName?: string;
  date: string;
  hours: number;
  minutes: number;
  notes: string;
};

const fakeProjects: Project[] = [
  {
    id: "proj-1",
    name: "مشروع ألف",
    subProjects: [{ id: "sub-1", name: "فرعي 1" }],
  },
  {
    id: "proj-2",
    name: "مشروع باء",
    subProjects: [{ id: "sub-2", name: "فرjjjjjjعي 2" }],
  },
  { id: "proj-3", name: "مشروع جيم" },
];

const fakeSessions: Session[] = [
  {
    id: "sess-1",
    projectId: "proj-1",
    projectName: "مشروع ألف",
    date: "2025-08-10",
    hours: 1,
    minutes: 30,
    notes: "مراجعة أولية",
  },
  {
    id: "sess-2",
    projectId: "proj-1",
    projectName: "مشروع ألف",
    date: "2025-08-10",
    hours: 0,
    minutes: 45,
    notes: "تصميم الواجهة",
  },
  {
    id: "sess-3",
    date: "2025-08-11",
    hours: 5,
    minutes: 0,
    notes: "جلسة بدون مشروع",
  },
  {
    id: "sess-4",
    projectId: "proj-2",
    projectName: "مشروع باء",
    date: "2025-08-11",
    hours: 1,
    minutes: 15,
    notes: "برمجة المكونات",
  },
];

export default function SessionsByDay() {
  const [sessions, setSessions] = useState<Session[]>(fakeSessions);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsSession, setDetailsSession] = useState<Session | null>(null);
  const [dailyTarget, setDailyTarget] = useState(4); // القيمة الافتراضية

  const sessionsByDay = sessions.reduce<
    Record<string, { sessions: Session[]; totalMinutes: number }>
  >((acc, session) => {
    if (!acc[session.date])
      acc[session.date] = { sessions: [], totalMinutes: 0 };
    acc[session.date].sessions.push(session);
    acc[session.date].totalMinutes += session.hours * 60 + session.minutes;
    return acc;
  }, {});

  const sortedDays = Object.keys(sessionsByDay).sort((a, b) =>
    a > b ? -1 : 1
  );

  async function assignProject(sessionId: string, selectedId: string) {
    const main = fakeProjects.find((p) => p.id === selectedId);

    let projectName = "";
    let displayName = "";
    if (main) {
      projectName = main.name;
      displayName = main.name;
    } else {
      const parent = fakeProjects.find((p) =>
        p.subProjects?.some((s) => s.id === selectedId)
      );
      const sub = parent?.subProjects?.find((s) => s.id === selectedId);
      if (parent && sub) {
        projectName = `${sub.name} — ضمن ${parent.name}`;
        displayName = `${sub.name} / ${parent.name}`;
      } else {
        return;
      }
    }

    setSessions((prev) =>
      prev.map((sess) =>
        sess.id === sessionId
          ? { ...sess, projectId: selectedId, projectName: displayName }
          : sess
      )
    );

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedId, projectName }),
      });
    } catch {}
  }

  function confirmDelete() {
    if (!deleteSessionId) return;
    setSessions((prev) => prev.filter((s) => s.id !== deleteSessionId));
    setDeleteDialogOpen(false);
    setDeleteSessionId(null);
  }

  // حساب الإنجاز الكلي
  const totalMinutesAllTime = sessions.reduce(
    (sum, s) => sum + s.hours * 60 + s.minutes,
    0
  );
  const totalHoursAllTime = Math.floor(totalMinutesAllTime / 60);
  const totalMinutesRemainder = totalMinutesAllTime % 60;

  // توليد النجوم
  function renderStars(totalMinutes: number) {
    const fraction = Math.min(totalMinutes / (dailyTarget * 60), 1);
    const totalStars = 3;
    const filledStars = fraction * totalStars;

    return Array.from({ length: totalStars }, (_, i) => {
      const starValue = i + 1;
      if (filledStars >= starValue) {
        return <Star key={i} className="text-yellow-400 fill-yellow-400" />;
      } else if (filledStars > i && filledStars < starValue) {
        return (
          <Star
            key={i}
            className="text-yellow-400 fill-yellow-400 opacity-50"
          />
        );
      } else {
        return <Star key={i} className="text-gray-300" />;
      }
    });
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
        const dayData = sessionsByDay[date];
        const isExpanded = expandedDays.includes(date);
        const hours = Math.floor(dayData.totalMinutes / 60);
        const minutes = dayData.totalMinutes % 60;

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
                  {date} - إلإنجاز اليوم: <span className="text-green-600 font-bold">{hours}h {minutes}m</span>
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
                    .sort((a, b) => (a.id > b.id ? 1 : -1))
                    .map((session) => {
                      const sessionHours = session.hours;
                      const sessionMinutes = session.minutes;
                      return (
                        <Card
                          key={session.id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex justify-between items-center w-full">


                              <div className="whitespace-nowrap font-extrabold text-gray-700 dark:text-white">
                                {sessionHours}h {sessionMinutes}m
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setDetailsSession(session);
                                  }}
                                >
                                  تفاصيل
                                </Button>

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteSessionId(session.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  حذف
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        );
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
            <DialogTitle>تفاصيل الجلسة</DialogTitle>
          </DialogHeader>
            <DialogTitle>المشروع الذي تم العمل عليه ﺃثناء الجلسة:</DialogTitle>
          <div className="text-gray-700 dark:text-white text-lg whitespace-pre-wrap min-h-[60px]">
            {detailsSession?.projectName || <span className="text-red-600"> المشروع تم حذفه.</span>}
          </div>

            <DialogTitle>ملاحظات الجلسة:</DialogTitle>
          <div className="text-gray-700 dark:text-white text-lg whitespace-pre-wrap min-h-[60px]">
            {detailsSession?.notes || "لا توجد ملاحظات"}
          </div>


          <DialogFooter className="flex justify-end gap-2">
            <Button onClick={() => setDetailsSession(null)}>
              إغلاق
            </Button>
          </DialogFooter>
          
        </DialogContent>
      </Dialog>
    </div>
  );
}
