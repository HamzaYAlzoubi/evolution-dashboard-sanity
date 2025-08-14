"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Star } from "lucide-react";

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
  { id: "proj-1", name: "مشروع ألف", subProjects: [{ id: "sub-1", name: "فرعي 1" }] },
  { id: "proj-2", name: "مشروع باء", subProjects: [{ id: "sub-2", name: "فرعي 2" }] },
  { id: "proj-3", name: "مشروع جيم" },
];

const fakeSessions: Session[] = [
  { id: "sess-1", projectId: "proj-1", projectName: "مشروع ألف", date: "2025-08-10", hours: 1, minutes: 30, notes: "مراجعة أولية" },
  { id: "sess-2", projectId: "proj-1", projectName: "مشروع ألف", date: "2025-08-10", hours: 0, minutes: 45, notes: "تصميم الواجهة" },
  { id: "sess-3", date: "2025-08-11", hours: 5, minutes: 0, notes: "جلسة بدون مشروع" },
  { id: "sess-4", projectId: "proj-2", projectName: "مشروع باء", date: "2025-08-11", hours: 1, minutes: 15, notes: "برمجة المكونات" },
];

export default function SessionsByDay() {
  const [sessions, setSessions] = useState<Session[]>(fakeSessions);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const dailyTargetMinutes = 4 * 60; // هدف افتراضي 4 ساعات

  const sessionsByDay = sessions.reduce<Record<string, { sessions: Session[]; totalMinutes: number }>>(
    (acc, session) => {
      if (!acc[session.date]) acc[session.date] = { sessions: [], totalMinutes: 0 };
      acc[session.date].sessions.push(session);
      acc[session.date].totalMinutes += session.hours * 60 + session.minutes;
      return acc;
    },
    {}
  );

  const sortedDays = Object.keys(sessionsByDay).sort((a, b) => (a > b ? -1 : 1));

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
  const totalMinutesAllTime = sessions.reduce((sum, s) => sum + s.hours * 60 + s.minutes, 0);
  const totalHoursAllTime = Math.floor(totalMinutesAllTime / 60);
  const totalMinutesRemainder = totalMinutesAllTime % 60;

  // توليد النجوم
  function renderStars(totalMinutes: number) {
    const fraction = Math.min(totalMinutes / dailyTargetMinutes, 1);
    const totalStars = 3;
    const filledStars = fraction * totalStars;

    return Array.from({ length: totalStars }, (_, i) => {
      const starValue = i + 1;
      if (filledStars >= starValue) {
        return <Star key={i} className="text-yellow-400 fill-yellow-400" />;
      } else if (filledStars > i && filledStars < starValue) {
        return <Star key={i} className="text-yellow-400 fill-yellow-400 opacity-50" />;
      } else {
        return <Star key={i} className="text-gray-300" />;
      }
    });
  }

  return (
    <div className="p-6 md:mr-64 duration-300 max-w-4xl mx-auto space-y-6">
      {/* الإنجاز الكلي */}
      <div className="bg-gradient-to-r from-gray-500 to-[#0f172b] text-white p-4 rounded-xl shadow text-center text-lg font-bold">
        إنجازك منذ استخدام التطبيق: {totalHoursAllTime} ساعة {totalMinutesRemainder} دقيقة 🚀
      </div>

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
                  prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
                )
              }
            >
              {/* رأس اليوم */}
              <div className="flex justify-between items-center">
                <div className="font-semibold">
                  {date} - إجمالي الوقت: {hours}س {minutes}د
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(dayData.totalMinutes)}</div>
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
                          className="p-3 bg-gray-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex flex-col gap-1 flex-1">
                              <Select
                                value={session.projectId || ""}
                                onValueChange={(val) => assignProject(session.id, val)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="اختر المشروع" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fakeProjects.map((proj) => (
                                    <div key={proj.id}>
                                      <SelectItem value={proj.id}>{proj.name}</SelectItem>
                                      {proj.subProjects?.map((sub) => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                          {sub.name} / {proj.name}
                                        </SelectItem>
                                      ))}
                                    </div>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                {session.notes || "لا توجد ملاحظات"}
                              </div>
                            </div>

                            <div className="whitespace-nowrap font-mono text-gray-700">
                              {sessionHours}س {sessionMinutes}د
                            </div>

                            <div>
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
    </div>
  );
}
