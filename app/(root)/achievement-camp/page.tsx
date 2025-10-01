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
import { Heart, Pencil, Loader2, Trophy } from "lucide-react";
import { OnboardingTour } from "@/components/camp/OnboardingTour";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip as ChartTooltip } from "recharts";
import { motion, LayoutGroup } from "framer-motion";

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
    case "النبلاء": return "bg-pink-200 text-pink-800 border-pink-300";
    case "قائد": return "bg-purple-200 text-purple-800 border-purple-300";
    case "فارس": return "bg-indigo-200 text-indigo-800 border-indigo-300";
    case "مجتهد": return "bg-blue-200 text-blue-800 border-blue-300";
    default: return "bg-gray-200 text-gray-800 border-gray-300"; // مبتدئ
  }
};

// Helper function to determine rank based on total minutes and position
const getRank = (totalMinutes: number, rankIndex: number) => {
  const totalHours = totalMinutes / 60;

  // The #1 ranked user gets the exclusive title IF they meet the hour requirement.
  if (rankIndex === 0 && totalHours >= 1000) {
    return "أمير المؤمنين";
  }

  // For all other users, use the standard progression.
  if (totalHours >= 800) return "أمير";
  if (totalHours >= 500) return "النبلاء";
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
  const [usersWithStats, setUsersWithStats] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'total' | 'today'>('total');
  const [seasonsDialogOpen, setSeasonsDialogOpen] = useState(false);
  const [seasonsView, setSeasonsView] = useState<'current' | 'past'>('current');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const users: User[] = await sanityClient.fetch(getUsersQuery);
      const today = new Date().toISOString().split('T')[0];

      // Step 1: Process minutes for each user
      const usersWithMinutes = users.map(user => {
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

        return { ...user, totalMinutes, todayMinutes };
      });

      // Step 2: Sort users by total minutes to establish ranks
      usersWithMinutes.sort((a, b) => b.totalMinutes - a.totalMinutes);

      // Step 3: Assign rank titles based on sorted position
      const finalUsersWithStats = usersWithMinutes.map((user, index) => {
        const rankTitle = getRank(user.totalMinutes, index);
        return { ...user, rankTitle };
      });

      setUsersWithStats(finalUsersWithStats);
      setLoading(false);
    };

    fetchUsers();

    const savedSortBy = localStorage.getItem('leaderboardSortBy');
    if (savedSortBy === 'total' || savedSortBy === 'today') {
      setSortBy(savedSortBy);
    }
  }, []);

  const handleSaveGoal = async () => {
    if (!selectedUser || isSaving) return;

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen w-full flex-col items-center justify-center"><p>تحميل الأبطال...</p></div>;
  }

  // Sort users based on the toggle, but keep the original ranks
  const sortedUsers = [...usersWithStats].sort((a, b) => {
    if (sortBy === 'today') {
      // Primary sort: today's minutes
      if (b.todayMinutes !== a.todayMinutes) {
        return b.todayMinutes - a.todayMinutes;
      }
      // Secondary sort: total minutes as a tie-breaker
      return b.totalMinutes - a.totalMinutes;
    }
    // Default 'total' sort is already handled by the initial fetch, but we sort again for consistency.
    return b.totalMinutes - a.totalMinutes;
  });

  const topThree = sortedUsers.slice(0, 3);
  const restOfUsers = sortedUsers.slice(3);

  const podiumStyles = [
    { borderColor: 'border-yellow-400', bgColor: 'bg-yellow-50/50', icon: '🥇', scale: 'scale-110' }, // Gold
    { borderColor: 'border-gray-400', bgColor: 'bg-gray-50/50', icon: '🥈', scale: 'scale-100' },  // Silver
    { borderColor: 'border-orange-400', bgColor: 'bg-orange-50/50', icon: '🥉', scale: 'scale-95' }, // Bronze
  ];

  const podiumOrder = [1, 0, 2];

  return (
    <>
      <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 md:p-12">
        <div className="flex items-center justify-center gap-4 my-6">
          <h1 className="text-4xl font-bold text-center">لوحة صدارة الأبطال</h1>
          <OnboardingTour />
        </div>

        {/* Sort By Toggle */}
        <div className="my-8 flex justify-center items-center gap-4">
          <LayoutGroup>
            <div className="relative p-1 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center w-fit mx-auto shadow-inner">
              {[{ id: 'total', label: 'الأبطال' }, { id: 'today', label: 'نجوم اليوم' }].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    const newSortBy = tab.id as 'total' | 'today';
                    setSortBy(newSortBy);
                    localStorage.setItem('leaderboardSortBy', newSortBy);
                  }}
                  className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors z-10 ${
                    sortBy === tab.id
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  {sortBy === tab.id && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full shadow"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <Button size="icon" variant="outline" className="rounded-full" onClick={() => setSeasonsDialogOpen(true)}>
            <Trophy className="h-5 w-5" />
          </Button>
        </div>

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
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth();
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

              // 1. Create a template for all days of the current month
              const monthData = Array.from({ length: daysInMonth }, (_, i) => {
                const dayNumber = i + 1;
                return {
                  name: String(dayNumber), // X-axis label
                  minutes: 0,
                };
              });

              // 2. Populate the template with the user's actual session data
              if (sessions) {
                sessions.forEach(session => {
                  if (!session || !session.date) return;
                  
                  const sessionDate = new Date(session.date);
                  if (sessionDate.getFullYear() === currentYear && sessionDate.getMonth() === currentMonth) {
                    const dayOfMonth = sessionDate.getDate(); // 1-based day
                    const totalMinutes = (Number(session.hours) || 0) * 60 + (Number(session.minutes) || 0);
                    
                    // Update the corresponding day in our template array
                    if (monthData[dayOfMonth - 1]) {
                      monthData[dayOfMonth - 1].minutes += totalMinutes;
                    }
                  }
                });
              }
              
              return monthData;
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
                                <Button onClick={handleSaveGoal} size="sm" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
                                </Button>
                                <Button onClick={() => setIsEditingGoal(false)} variant="secondary" size="sm" disabled={isSaving}>إلغاء</Button>
                            </div>
                        </div>
                    ) : (
                        <blockquote className="text-center text-base font-semibold text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
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
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis dx={-15} stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.floor(value / 60)}h`} />
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

      {/* Seasons Dialog */}
      <Dialog open={seasonsDialogOpen} onOpenChange={setSeasonsDialogOpen}>
        <DialogContent className="h-[80vh] flex flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>سجل المواسم</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <LayoutGroup>
              <div className="relative p-1 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center w-fit mx-auto shadow-inner">
                {[{ id: 'current', label: 'الموسم الحالي' }, { id: 'past', label: 'المواسم السابقة' }].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSeasonsView(tab.id as 'current' | 'past')}
                    className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors z-10 ${
                      seasonsView === tab.id
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                    }`}
                  >
                    {seasonsView === tab.id && (
                      <motion.div
                        layoutId="seasons-pill"
                        className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full shadow"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative">{tab.label}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>
          <div className="flex-grow overflow-y-auto no-scrollbar">
            {/* Content will go here */}
            {seasonsView === 'current' && (
              <p>محتوى الموسم الحالي...</p>
            )}
            {seasonsView === 'past' && (
              <p>محتوى المواسم السابقة...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AchievementCampPage;

