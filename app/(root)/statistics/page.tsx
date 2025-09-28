'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sanityClient } from "@/sanity/lib/client";
import { USER_QUERY } from "@/sanity/lib/queries";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaSpinner } from "react-icons/fa";
import { Calendar } from "@/components/StatisticsCalendar";

export default function StatisticsPage() {
  const { data: session, status } = useSession();
  const [sessions, setSessions] = useState<any[]>([]);
  const [dailyTarget, setDailyTarget] = useState(240); // Default to 240 minutes (4 hours)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      sanityClient.fetch(USER_QUERY, { userId: session.user.id }).then((data) => {
        if (data) {
          setSessions(data.sessions || []);
          setDailyTarget(data.dailyTarget || 240);
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
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const totalMinutesMonth = sessions
    .filter(s => s.date && s.date.startsWith(currentYearMonth))
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

  const sessionsByDay = sessions.reduce<Record<string, { totalMinutes: number }>>((acc, session) => {
    const date = session.date;
    if (!acc[date]) {
      acc[date] = { totalMinutes: 0 };
    }
    acc[date].totalMinutes += (Number(session.hours) || 0) * 60 + (Number(session.minutes) || 0);
    return acc;
  }, {});

  if (sessionsByDay['2025-07-26']) {
    delete sessionsByDay['2025-07-26'];
  }

  let highestDay: [string, { totalMinutes: number }] = ['', { totalMinutes: 0 }];
  if (Object.keys(sessionsByDay).length > 0) {
      highestDay = Object.entries(sessionsByDay).reduce((highest, current) => {
          return current[1].totalMinutes > highest[1].totalMinutes ? current : highest;
      });
  }

  const highestDayHours = Math.floor(highestDay[1].totalMinutes / 60);
  const highestDayMinutes = highestDay[1].totalMinutes % 60;

  const dynamicMonthTitle = now.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });

  // --- Monthly Goal & Percentage Calculation ---
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyTargetMinutes = dailyTarget * daysInMonth;
  const monthlyTargetHours = Math.floor(monthlyTargetMinutes / 60);
  const monthlyProgressPercentage = monthlyTargetMinutes > 0 ? Math.round((totalMinutesMonth / monthlyTargetMinutes) * 100) : 0;

  // --- Winning Days Calculation (Matcher Function Approach) ---
  const winLevelsMap = new Map<string, number>();
  if (dailyTarget > 0) {
    Object.entries(sessionsByDay).forEach(([dateString, data]) => {
      if (data.totalMinutes >= dailyTarget * 2) {
        winLevelsMap.set(dateString, 2);
      } else if (data.totalMinutes >= dailyTarget) {
        winLevelsMap.set(dateString, 1);
      }
    });
  }

  const isWinningDay = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return winLevelsMap.has(dateString);
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
            <div className="flex flex-row items-start justify-center gap-4 sm:gap-10">
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
                        {sessions.length > 0 ? highestDay[0] : '--/--/----'}
                    </p>
                </div>
            </div>
        </Card>

        {/* Second Row: Calendar and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="text-lg font-semibold">{dynamicMonthTitle}</CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">الهدف الشهري: {monthlyTargetHours} ساعة</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground dark:bg-primary dark:text-primary-foreground">{monthlyProgressPercentage}%</span>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-center pt-2">
                    <Calendar
                        mode="single"
                        winLevels={winLevelsMap}
                        modifiers={{ winning: isWinningDay }}
                        modifiersClassNames={{
                            winning: 'bg-primary text-primary-foreground rounded-md',
                        }}
                        className="p-0"
                        classNames={{ 
                            months: "flex flex-col  space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-medium",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground dark:bg-muted dark:text-muted-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                            day_disabled: "text-muted-foreground opacity-50",
                            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                            day_hidden: "invisible",
                         }}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>مخطط ساعات الإنجاز</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">سيتم بناء المخطط البياني هنا.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
