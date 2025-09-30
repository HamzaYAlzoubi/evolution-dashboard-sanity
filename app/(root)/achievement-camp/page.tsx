"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { sanityClient } from '@/sanity/lib/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { urlFor } from '@/sanity/lib/image';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, Pencil } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip as ChartTooltip } from "recharts";

// Helper function to format minutes into a readable string (e.g., "1,000h 25m")
const formatMinutes = (totalMinutes: number) => {
  if (isNaN(totalMinutes) || totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedHours = hours.toLocaleString('en-US');
  let result = '';
  if (hours > 0) result += `${formattedHours}h`;
  if (minutes > 0) {
    if (result) result += ' ';
    result += `${minutes}m`;
  }
  return result || '0m';
};

// Helper function to get style for ranks
const getRankStyle = (rankTitle: string) => {
  switch (rankTitle) {
    case "أمير المؤمنين": return "bg-yellow-200 text-yellow-800 border-yellow-300";
    case "أمير": return "bg-red-200 text-red-800 border-red-300";
    case "قائد": return "bg-purple-200 text-purple-800 border-purple-300";
    case "فارس": return "bg-indigo-200 text-indigo-800 border-indigo-300";
    case "مجتهد": return "bg-blue-200 text-blue-800 border-blue-300";
    default: return "bg-gray-200 text-gray-800 border-gray-300"; // مبتدئ
  }
};

// Helper function to determine rank based on total minutes
const getRank = (totalMinutes: number) => {
  const totalHours = totalMinutes / 60;
  if (totalHours >= 1000) return "أمير المؤمنين";
  if (totalHours >= 500) return "أمير";
  if (totalHours >= 300) return "قائد";
  if (totalHours >= 150) return "فارس";
  if (totalHours >= 50) return "مجتهد";
  return "مبتدئ";
};

interface User {
  _id: string;
  name: string;
  campGoal?: string;
  image?: any;
  sessions?: {
    date: string;
    hours: number;
    minutes: number;
  }[];
}

interface UserWithStats extends User {
  totalMinutes: number;
  todayMinutes: number;
  rankTitle: string;
}

const getUsersQuery = `*[_type == "user"] {
  _id,
  name,
  campGoal,
  image,
  "sessions": sessions[]->{
    date,
    hours,
    minutes
  }
}`;

const AchievementCampPage = () => {
  const { data: session } = useSession();
  console.log("Session Object:", session);
  const [usersWithStats, setUsersWithStats] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const users: User[] = await sanityClient.fetch(getUsersQuery);
      const today = new Date().toISOString().split('T')[0];

      const processedUsers = users.map(user => {
        const totalMinutes = user.sessions?.reduce((acc, s) => {
          if (!s) return acc;
          const hours = Number(s.hours || 0);
          const minutes = Number(s.minutes || 0);
          return acc + (hours * 60) + minutes;
        }, 0) || 0;

        const todayMinutes = user.sessions
          ?.filter(s => s && s.date === today)
          .reduce((acc, s) => {
            if (!s) return acc;
            const hours = Number(s.hours || 0);
            const minutes = Number(s.minutes || 0);
            return acc + (hours * 60) + minutes;
          }, 0) || 0;

        const rankTitle = getRank(totalMinutes);
        return { ...user, totalMinutes, todayMinutes, rankTitle };
      });

      processedUsers.sort((a, b) => b.totalMinutes - a.totalMinutes);
      setUsersWithStats(processedUsers);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleSaveGoal = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser._id, campGoal: goalText }),
      });

      if (!response.ok) {
        throw new Error('Failed to save goal');
      }

      const updatedUserData = await response.json();

      // Optimistic update for the selected user in the dialog
      setSelectedUser(prev => prev ? { ...prev, campGoal: goalText } : null);

      // Update the main users list to reflect the change immediately
      setUsersWithStats(prevUsers =>
        prevUsers.map(u => (u._id === selectedUser._id ? { ...u, campGoal: goalText } : u))
      );

      setIsEditingGoal(false);
    } catch (error) {
      console.error("Error saving goal:", error);
      // Optionally, add user-facing error feedback here
    }
  };

  if (loading) {
    return <div className="flex min-h-screen w-full flex-col items-center justify-center"><p>تحميل الأبطال...</p></div>;
  }

  const topThree = usersWithStats.slice(0, 3);
  const restOfUsers = usersWithStats.slice(3);

  const podiumStyles = [
    { borderColor: 'border-yellow-400', bgColor: 'bg-yellow-50/50', icon: '🥇', scale: 'scale-110' }, // Gold
    { borderColor: 'border-gray-400', bgColor: 'bg-gray-50/50', icon: '🥈', scale: 'scale-100' },  // Silver
    { borderColor: 'border-orange-400', bgColor: 'bg-orange-50/50', icon: '🥉', scale: 'scale-95' }, // Bronze
  ];

  const podiumOrder = [1, 0, 2];

  return (
    <>
      <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 md:p-12">
        <h1 className="text-4xl font-bold my-6 text-center">لوحة صدارة الأبطال</h1>

        {topThree.length >= 1 && (
          <div className="w-full max-w-4xl my-10 flex justify-center items-end gap-2 sm:gap-3">
            {podiumOrder.map(orderIndex => {
              const user = topThree[orderIndex];
              if (!user) return null;
              const style = podiumStyles[orderIndex];
              const avatarSize = orderIndex === 0 ? "h-16 w-16 sm:h-18 sm:w-18" : "h-12 w-12 sm:h-14 sm:w-14";
              const ringSize = orderIndex === 0 ? 80 : 64;
              const ringStrokeWidth = orderIndex === 0 ? 5 : 4;

              return (
                <div key={user._id} className={`transform transition-all duration-300 ${style.scale} w-1/3 max-w-[180px] cursor-pointer hover:-translate-y-3`} onClick={() => setSelectedUser(user)}>
                  <Card className={`w-full flex flex-col border-4 ${style.borderColor} ${style.bgColor}`}>
                    <CardHeader className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4">
                      <span className="text-3xl sm:text-4xl">{style.icon}</span>
                      <p className="text-[0.6rem] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 my-0.5 sm:my-1 text-center">{`تحدي المعسكر: ${Math.round(Math.min((user.todayMinutes / 240) * 100, 100))}%`}</p>
                      <ProgressRing progress={Math.min((user.todayMinutes / 240) * 100, 100)} size={ringSize} strokeWidth={ringStrokeWidth}>
                        <Avatar className={`${avatarSize} border-2 border-white`}>
                          <AvatarImage src={user.image ? urlFor(user.image).width(100).url() : undefined} alt={user.name} />
                          <AvatarFallback>{user.name ? user.name.charAt(0) : '?'}</AvatarFallback>
                        </Avatar>
                      </ProgressRing>
                      <CardTitle className="text-center text-sm sm:text-base">{user.name}</CardTitle>
                      <Badge className={`border text-xxs sm:text-xs ${getRankStyle(user.rankTitle)}`}>{user.rankTitle}</Badge>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between p-2 sm:p-4">
                      <div className="space-y-1 sm:space-y-3 text-center">
                        <div>
                          <h3 className="font-semibold text-gray-600 dark:text-gray-300 text-xs sm:text-sm">الإنجاز الكلي</h3>
                          <p className="text-base sm:text-xl font-bold">{formatMinutes(user.totalMinutes)}</p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-600 dark:text-gray-300 text-xs sm:text-sm">إنجاز اليوم</h3>
                          <p className="text-sm sm:text-lg font-bold">{formatMinutes(user.todayMinutes)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        <div className="w-full max-w-4xl mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {restOfUsers.map((user, index) => {
            const rank = index + 4;
            return (
              <div key={user._id} className="cursor-pointer transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.03]" onClick={() => setSelectedUser(user)}>                <Card className="w-full flex flex-col p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-gray-500">#{rank}</span>
                        <ProgressRing progress={Math.min((user.todayMinutes / 240) * 100, 100)} size={56} strokeWidth={4}>
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.image ? urlFor(user.image).width(100).url() : undefined} alt={user.name} />
                                <AvatarFallback>{user.name ? user.name.charAt(0) : '?'}</AvatarFallback>
                            </Avatar>
                        </ProgressRing>
                        <div className="flex-grow">
                            <p className="text-lg font-semibold">{user.name}</p>
                            <Badge className={`border ${getRankStyle(user.rankTitle)}`}>{user.rankTitle}</Badge>
                        </div>
                    </div>
                    <div className="mt-3 text-center space-y-2">
                         <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{`تحدي المعسكر: ${Math.round(Math.min((user.todayMinutes / 240) * 100, 100))}%`}</p>
                         <div className="flex justify-around">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">الإنجاز الكلي</h3>
                                <p className="font-bold">{formatMinutes(user.totalMinutes)}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">إنجاز اليوم</h3>
                                <p className="font-bold">{formatMinutes(user.todayMinutes)}</p>
                            </div>
                         </div>
                    </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(isOpen) => { 
        if (!isOpen) {
          setSelectedUser(null); 
          setIsEditingGoal(false);
        }
      }}>
        <DialogContent>
          {selectedUser && (() => {
            // Data processing for the chart
            const processChartData = (sessions: typeof selectedUser.sessions) => {
              const sessionMap = new Map<string, number>();
              sessions?.forEach(s => {
                if (!s) return;
                const date = s.date.split('T')[0];
                const totalMinutes = (s.hours || 0) * 60 + (s.minutes || 0);
                sessionMap.set(date, (sessionMap.get(date) || 0) + totalMinutes);
              });

              const data = [];
              for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                data.push({
                  name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  minutes: sessionMap.get(dateString) || 0,
                });
              }
              return data;
            };
            const chartData = processChartData(selectedUser.sessions);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-center">{selectedUser.name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 pt-4 max-h-[80vh] overflow-y-auto no-scrollbar px-2">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{`تحدي المعسكر: ${Math.round(Math.min((selectedUser.todayMinutes / 240) * 100, 100))}%`}</p>
                  <ProgressRing progress={Math.min((selectedUser.todayMinutes / 240) * 100, 100)} size={80} strokeWidth={5}>
                    <Avatar className="w-18 h-18 border-2 border-white">
                      <AvatarImage src={selectedUser.image ? urlFor(selectedUser.image).width(100).url() : undefined} alt={selectedUser.name} />
                      <AvatarFallback>{selectedUser.name ? selectedUser.name.charAt(0) : '?'}</AvatarFallback>
                    </Avatar>
                  </ProgressRing>
                  <h2 className="pt-2 text-xl font-bold">{selectedUser.name}</h2>
                  <Badge className={`border text-xs ${getRankStyle(selectedUser.rankTitle)}`}>{selectedUser.rankTitle}</Badge>

                  {/* Stats moved here */}
                  <div className="flex w-full justify-center gap-8 mt-4">
                    <div className="text-center">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">الإنجاز الكلي</h3>
                      <p className="text-lg font-bold">{formatMinutes(selectedUser.totalMinutes)}</p>
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">إنجاز اليوم</h3>
                      <p className="text-lg font-bold">{formatMinutes(selectedUser.todayMinutes)}</p>
                    </div>
                  </div>

                  <Separator className="my-4 w-1/2" />

                  <div className="mt-2 w-full rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div className="flex items-center justify-center mb-2">
                        <h3 className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">هدف المعسكر</h3>
                        {!isEditingGoal && session?.user?.id === selectedUser?._id && (
                            <button onClick={() => { setIsEditingGoal(true); setGoalText(selectedUser.campGoal || ''); }} className="ml-2 p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                <Pencil size={14} />
                            </button>
                        )}
                    </div>
                    {isEditingGoal ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                            <Textarea
                                value={goalText}
                                onChange={(e) => setGoalText(e.target.value)}
                                placeholder="اكتب هدفك هنا..."
                                className="w-full text-sm"
                                rows={3}
                            />
                            <div className="flex gap-2 self-end">
                                <Button onClick={handleSaveGoal} size="sm">حفظ</Button>
                                <Button onClick={() => setIsEditingGoal(false)} variant="secondary" size="sm">إلغاء</Button>
                            </div>
                        </div>
                    ) : (
                        <blockquote className="text-center text-base font-semibold text-slate-700 dark:text-slate-200">
                            {selectedUser.campGoal ? `"${selectedUser.campGoal}"` : '"لم يتم تحديد هدف بعد"'}
                        </blockquote>
                    )}
                  </div>

                  <div className="mt-4 w-full">
                    <h3 className="mb-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">الفرص المتبقية</h3>
                    <div className="flex justify-center gap-4">
                      {(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentYear = today.getFullYear();
                        const daysInMonthSoFar = today.getDate();
                        const dailyTarget = 240; // 4 hours in minutes

                        const sessionsByDay = new Map<number, number>();

                        selectedUser.sessions?.forEach(s => {
                          if (!s) return;
                          const sessionDate = new Date(s.date);
                          if (sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear) {
                            const dayOfMonth = sessionDate.getDate();
                            const totalMinutes = (s.hours || 0) * 60 + (s.minutes || 0);
                            sessionsByDay.set(dayOfMonth, (sessionsByDay.get(dayOfMonth) || 0) + totalMinutes);
                          }
                        });

                        let livesLost = 0;
                        // We check failures for past days only, not today.
                        for (let day = 1; day < daysInMonthSoFar; day++) {
                          const achievedMinutes = sessionsByDay.get(day) || 0;
                          if (achievedMinutes < dailyTarget) {
                            livesLost++;
                          }
                        }

                        return Array.from({ length: 3 }).map((_, index) => {
                          const isLost = index < livesLost;
                          return <Heart key={index} className={`h-8 w-8 transition-all ${isLost ? 'fill-slate-300 stroke-slate-400 dark:fill-slate-700 dark:stroke-slate-500' : 'fill-red-500 stroke-red-600'}`} />;
                        });
                      })()}
                    </div>
                  </div>

                  {/* Chart Section */}
                  <div className="mt-4 w-full">
                    <h3 className="mb-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">النشاط اليومي (آخر 30 يومًا)</h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} unit="m" />
                          <ChartTooltip
                            cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                            contentStyle={{ backgroundColor: '#ffffffaa', border: '1px solid #ccc', borderRadius: '0.5rem' }}
                            labelStyle={{ fontWeight: 'bold' }}
                            formatter={(value: number) => [formatMinutes(value), 'الإنجاز']}
                          />
                          <ReferenceLine y={240} stroke="#10b981" strokeDasharray="3 3" />
                          <Bar dataKey="minutes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AchievementCampPage;

