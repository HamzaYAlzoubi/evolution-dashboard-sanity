'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sanityClient } from "@/sanity/lib/client";
import { USER_QUERY } from "@/sanity/lib/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaSpinner } from "react-icons/fa";

export default function StatisticsPage() {
  const { data: session, status } = useSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      sanityClient.fetch(USER_QUERY, { userId: session.user.id }).then((data) => {
        if (data) {
          setSessions(data.sessions || []);
        }
        setIsLoading(false);
      });
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, session]);

  // --- Data Calculation Logic --- //
  const totalMinutesAllTime = sessions.reduce(
    (sum, s) => sum + (Number(s.hours) || 0) * 60 + (Number(s.minutes) || 0),
    0
  );
  const totalHoursAllTime = Math.floor(totalMinutesAllTime / 60);
  const totalMinutesRemainder = totalMinutesAllTime % 60;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const totalMinutesMonth = sessions
    .filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
    })
    .reduce((sum, s) => sum + (Number(s.hours) || 0) * 60 + (Number(s.minutes) || 0), 0);
  const totalHoursMonth = Math.floor(totalMinutesMonth / 60);
  const totalMinutesMonthRemainder = totalMinutesMonth % 60;

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const totalMinutesWeek = sessions
    .filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= sevenDaysAgo;
    })
    .reduce((sum, s) => sum + (Number(s.hours) || 0) * 60 + (Number(s.minutes) || 0), 0);
  const totalHoursWeek = Math.floor(totalMinutesWeek / 60);
  const totalMinutesWeekRemainder = totalMinutesWeek % 60;

  // --- Highest Achievement Day Logic --- //
  const sessionsByDay = sessions.reduce<Record<string, { totalMinutes: number }>>((acc, session) => {
    const date = session.date;
    if (!acc[date]) {
      acc[date] = { totalMinutes: 0 };
    }
    acc[date].totalMinutes += (Number(session.hours) || 0) * 60 + (Number(session.minutes) || 0);
    return acc;
  }, {});

  // Exclude the specific date as requested by the user
  if (sessionsByDay['2025-07-26']) {
    delete sessionsByDay['2025-07-26'];
  }

  let highestDay = { date: '--/--/----', totalMinutes: 0 };
  if (Object.keys(sessionsByDay).length > 0) {
      highestDay = Object.entries(sessionsByDay).reduce((highest, current) => {
          return current[1].totalMinutes > highest[1].totalMinutes ? current : highest;
      }, ['', {totalMinutes: 0}]);
      highestDay = { date: highestDay[0], totalMinutes: highestDay[1].totalMinutes };
  }

  const highestDayHours = Math.floor(highestDay.totalMinutes / 60);
  const highestDayMinutes = highestDay.totalMinutes % 60;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FaSpinner className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
        <Card className="bg-card border border-border rounded-2xl p-4 md:p-8 flex flex-col items-center justify-center gap-4 md:gap-8 shadow-sm">
            <div className="flex flex-col items-center gap-2">
                <span className="text-base font-semibold text-muted-foreground">الإنجاز منذ البداية</span>
                <Badge className="text-2xl md:text-3xl font-bold px-4 py-2 md:px-6 md:py-3 bg-primary text-primary-foreground rounded-xl shadow-lg">{`${totalHoursAllTime.toLocaleString()}h ${totalMinutesRemainder}m`}</Badge>
            </div>
            <div className="flex flex-row items-start justify-center gap-4 sm:gap-10 m-3">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">إنجاز الأسبوع</span>
                    <Badge className="text-base md:text-lg font-bold px-3 py-1.5 md:px-4 md:py-2 bg-primary text-primary-foreground rounded-xl shadow whitespace-nowrap">{`${totalHoursWeek.toLocaleString()}h ${totalMinutesWeekRemainder}m`}</Badge>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">إنجاز الشهر</span>
                    <Badge className="text-base md:text-lg font-bold px-3 py-1.5 md:px-4 md:py-2 bg-primary text-primary-foreground rounded-xl shadow whitespace-nowrap">{`${totalHoursMonth.toLocaleString()}h ${totalMinutesMonthRemainder}m`}</Badge>
                </div>
                <div className="flex flex-col items-center gap-1 mt-1">
                    <span className="text-xs sm:text-sm font-semibold text-muted-foreground whitespace-nowrap">اليوم الأعلى إنجازًا</span>
                    <Badge className="text-base md:text-lg font-bold px-3 py-1.5 md:px-4 md:py-2 bg-primary text-primary-foreground rounded-xl shadow whitespace-nowrap">
                        {sessions.length > 0 ? `${highestDayHours}h ${highestDayMinutes}m` : '--h --m'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                        {sessions.length > 0 ? highestDay.date : '--/--/----'}
                    </p>
                </div>
            </div>
        </Card>
    </div>
  );
}