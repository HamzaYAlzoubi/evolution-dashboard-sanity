'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sanityClient } from "@/sanity/lib/client";
import { USER_QUERY } from "@/sanity/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Star, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FaSpinner } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import { parse, format } from 'date-fns';

type Session = {
  _id: string;
  projectId?: string;
  projectName?: string;
  date: string;
  time?: string;
  hours: string;
  minutes: string;
  notes: string;
};

export default function SessionsByDay() {
  const { data: session, status } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsSession, setDetailsSession] = useState<Session | null>(null);
  const [dailyTarget, setDailyTarget] = useState(240);

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [showDetailedTime, setShowDetailedTime] = useState(false);

  useEffect(() => {
    const savedShowDetailedTime = localStorage.getItem("showDetailedTime");
    if (savedShowDetailedTime) {
      setShowDetailedTime(JSON.parse(savedShowDetailedTime));
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      sanityClient.fetch(USER_QUERY, { userId: session.user.id }).then((data) => {
        if (data) {
          setSessions(data.sessions || []);
          setDailyTarget(data.dailyTarget || 240);
          setUserData(data);
        }
        setIsLoading(false);
      });
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, session]);

  const sessionsByDay = sessions.reduce<
    Record<string, { sessions: Session[]; totalMinutes: number }>
  >((acc, session) => {
    if (!acc[session.date])
      acc[session.date] = { sessions: [], totalMinutes: 0 };
    acc[session.date].sessions.push(session);
    acc[session.date].totalMinutes += (Number(session.hours) || 0) * 60 + (Number(session.minutes) || 0);
    return acc;
  }, {});

  const sortedDays = Object.keys(sessionsByDay).sort((a, b) =>
    a > b ? -1 : 1
  );

  async function assignProject(sessionId: string, selectedId: string) {
    console.log("Assigning project", sessionId, selectedId);
  }

  const confirmDelete = async () => {
    if (!deleteSessionId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${deleteSessionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s._id !== deleteSessionId));
        setDeleteDialogOpen(false);
        setDeleteSessionId(null);
      } else {
        console.error("Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalMinutesAllTime = sessions.reduce(
    (sum, s) => sum + (Number(s.hours) || 0) * 60 + (Number(s.minutes) || 0),
    0
  );
  const totalHoursAllTime = Math.floor(totalMinutesAllTime / 60);
  const totalMinutesRemainder = totalMinutesAllTime % 60;

  // Monthly Achievement
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalMinutesMonth = sessions
    .filter(s => s.date && s.date.startsWith(currentYearMonth))
    .reduce((sum, s) => sum + (Number(s.hours) || 0) * 60 + (Number(s.minutes) || 0), 0);
  const totalHoursMonth = Math.floor(totalMinutesMonth / 60);
  const totalMinutesMonthRemainder = totalMinutesMonth % 60;

  // Weekly Achievement (Last 7 days)
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6); // Today + 6 previous days = 7 days
  sevenDaysAgo.setHours(0, 0, 0, 0); // Start of the 7th day ago

  const totalMinutesWeek = sessions
    .filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= sevenDaysAgo;
    })
    .reduce((sum, s) => sum + (Number(s.hours) || 0) * 60 + (Number(s.minutes) || 0), 0);
  const totalHoursWeek = Math.floor(totalMinutesWeek / 60);
  const totalMinutesWeekRemainder = totalMinutesWeek % 60;

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

  function renderStars(totalMinutes: number) {
    const targetMinutes = dailyTarget;
    if (targetMinutes === 0) return null;
    const fraction = Math.min(totalMinutes / targetMinutes, 1);
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

  const formatSessionTime = (timeString: string | undefined) => {
    if (!timeString || !/^\d{2}:\d{2}$/.test(timeString)) {
      return null;
    }
    try {
      const date = parse(timeString, 'HH:mm', new Date());
      return format(date, 'h:mm a');
    } catch (error) {
      console.error("Failed to format time:", error);
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FaSpinner className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-lg rounded-2xl p-8 flex  flex-col items-center justify-between  ">
        <div className="flex flex-col items-center gap-2">
          <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
            الإنجاز منذ البداية
          </span>
          <Badge className="text-lg px-4 py-2 dark:bg-[#6866F1] bg-[#101828] dark:text-white rounded-xl shadow">
            {showDetailedTime ? formatTimeDetailed(totalHoursAllTime, totalMinutesRemainder) : `${totalHoursAllTime.toLocaleString()}h ${totalMinutesRemainder}m`}
          </Badge>
        </div>

        <div className="flex flex-row-reverse justify-between items-center gap-6">
          <div className="flex flex-col items-center gap-2 ">
            <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
              إنجاز الشهر
            </span>
            <Badge className="text-lg px-4 py-2 dark:bg-[#6866F1] bg-[#101828] dark:text-white rounded-xl shadow">
              {showDetailedTime ? formatTimeDetailed(totalHoursMonth, totalMinutesMonthRemainder) : `${totalHoursMonth.toLocaleString()}h ${totalMinutesMonthRemainder}m`}
            </Badge>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-base font-semibold  text-gray-700 dark:text-gray-200">
              إنجاز الأسبوع
            </span>
            <Badge className="text-lg px-4 py-2 dark:bg-[#6866F1] bg-[#101828] rounded-xl shadow">
              {showDetailedTime ? formatTimeDetailed(totalHoursWeek, totalMinutesWeekRemainder) : `${totalHoursWeek.toLocaleString()}h ${totalMinutesWeekRemainder}m`}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">إدارة الجلسات حسب اليوم</h1>
        <Button size="icon" variant="ghost" onClick={() => setSettingsDialogOpen(true)}>
            <Settings />
        </Button>
      </div>

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

              {isExpanded && (
                <div className="space-y-3">
                  {dayData.sessions
                    .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
                    .map((session) => {
                      const sessionHours = Number(session.hours) || 0;
                      const sessionMinutes = Number(session.minutes) || 0;
                      return (
                        <Card
                          key={session._id}
                          className="p-3 bg-gray-50 dark:bg-gray-800 duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="flex justify-between items-center w-full">


                              <div className="whitespace-nowrap font-extrabold ml-3 text-gray-700 dark:text-white">
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
                                    setDeleteSessionId(session._id);
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>هل أنت متأكد من حذف الجلسة؟</DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <FaSpinner className="animate-spin" /> : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detailsSession}
        onOpenChange={() => setDetailsSession(null)}
      >
        <DialogContent>

          <DialogHeader>
            <DialogTitle>تفاصيل الجلسة</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">تاريخ ووقت الجلسة</h3>
            <p className="text-lg">
              {detailsSession?.date}
              {detailsSession?.time && formatSessionTime(detailsSession.time) && (
                <span className="mx-2">•</span>
              )}
              {detailsSession?.time && formatSessionTime(detailsSession.time)}
            </p>
          </div>

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

    </div>
  );
}