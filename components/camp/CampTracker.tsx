'use client';

import { useState, useEffect } from 'react';
import { Heart, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define the types based on the API response
interface DailyProgress {
  day: number;
  status: 'success' | 'fail' | 'pending';
}

interface CampUser {
  _id: string;
  name: string;
  image: string | null;
  lives: number;
  isEliminated: boolean;
  dailyProgress: DailyProgress[];
  currentStreak: number;
}

const CampTracker = () => {
  const [users, setUsers] = useState<CampUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/camp-status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: CampUser[] = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Failed to fetch camp status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="text-center p-10">جاري تحميل بيانات المعسكر...</div>;
  }

  if (users.length === 0) {
    return <div className="text-center p-10">لا يوجد مشاركين في المعسكر حاليًا.</div>;
  }

  return (
    <div dir="rtl" className="w-full max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">لوحة متصدري معسكر الإنجاز</h1>
      <div className="space-y-4">
        {users.map((user, index) => (
          <div
            key={user._id}
            className={cn(
              "bg-card p-4 rounded-lg shadow-md border-2 transition-all",
              user.isEliminated ? "border-red-500/50 opacity-60" : "border-transparent"
            )}
          >
            <div className="flex items-center gap-4 mb-3">
              <span className="text-2xl font-bold text-muted-foreground w-8 text-center">{index + 1}</span>
              <Avatar>
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="text-lg font-semibold flex-grow">{user.name}</p>

              {user.currentStreak > 1 && (
                <div className="flex items-center gap-1 text-orange-500 animate-pulse" title={`سلسلة نجاح: ${user.currentStreak} أيام`}>
                    <span className="font-bold text-lg">{user.currentStreak}</span>
                    <Flame className="h-5 w-5" />
                </div>
              )}

              <div className="flex gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={cn(
                      "h-6 w-6 transition-colors",
                      i < user.lives ? "text-red-500 fill-current" : "text-muted-foreground/50 fill-current"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-15 gap-1.5 pr-12">
              {user.dailyProgress.map((day) => (
                <div
                  key={day.day}
                  title={`اليوم ${day.day}: ${day.status}`}
                  className={cn("h-4 w-4 rounded-sm", {
                    "bg-green-500": day.status === 'success',
                    "bg-red-500": day.status === 'fail',
                    "bg-muted": day.status === 'pending',
                  })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampTracker;
