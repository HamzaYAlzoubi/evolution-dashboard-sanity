import { sanityClient } from '@/sanity/lib/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { urlFor } from '@/sanity/lib/image';

// Helper function to format minutes into a readable string (e.g., "1,000h 25m")
const formatMinutes = (totalMinutes: number) => {
  if (isNaN(totalMinutes) || totalMinutes <= 0) return '0m';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const formattedHours = hours.toLocaleString('en-US');

  let result = '';

  if (hours > 0) {
    result += `${formattedHours}h`;
  }

  if (minutes > 0) {
    if (result) result += ' ';
    result += `${minutes}m`;
  }

  return result || '0m';
};

interface User {
  _id: string;
  name: string;
  image?: any;
  sessions?: {
    date: string;
    hours: number;
    minutes: number;
  }[];
}

const getUsersQuery = `*[_type == "user"] {
  _id,
  name,
  image,
  "sessions": sessions[]->{
    date,
    hours,
    minutes
  }
}`;

const AchievementCampPage = async () => {
  const users: User[] = await sanityClient.fetch(getUsersQuery);
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  // 1. Augment users with calculated minutes
  const usersWithStats = users.map(user => {
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

  // 2. Sort users by totalMinutes in descending order
  usersWithStats.sort((a, b) => b.totalMinutes - a.totalMinutes);

  // 3. Split users for Podium and the rest of the list
  const topThree = usersWithStats.slice(0, 3);
  const restOfUsers = usersWithStats.slice(3);

  const podiumStyles = [
    { borderColor: 'border-yellow-400', bgColor: 'bg-yellow-50/50', icon: '🥇', scale: 'scale-110' }, // Gold
    { borderColor: 'border-gray-400', bgColor: 'bg-gray-50/50', icon: '🥈', scale: 'scale-100' },  // Silver
    { borderColor: 'border-orange-400', bgColor: 'bg-orange-50/50', icon: '🥉', scale: 'scale-95' }, // Bronze
  ];

  // Display order for the podium: 2nd, 1st, 3rd
  const podiumOrder = [1, 0, 2];

  return (
    <div className="flex min-h-screen w-full flex-col items-center p-4 sm:p-8 md:p-12">
      <h1 className="text-4xl font-bold mb-4 text-center">لوحة صدارة الأبطال</h1>

      {/* --- Podium Section --- */}
      {topThree.length >= 1 && (
        <div className="w-full max-w-4xl my-8 flex justify-center items-end gap-4">
          {podiumOrder.map(orderIndex => {
            const user = topThree[orderIndex];
            if (!user) return null;
            const style = podiumStyles[orderIndex];

            return (
              <div key={user._id} className={`transform transition-transform duration-300 ${style.scale}`}>
                <Card className={`w-full flex flex-col border-4 ${style.borderColor} ${style.bgColor}`}>
                  <CardHeader className="flex flex-col items-center gap-2 p-4">
                    <span className="text-4xl">{style.icon}</span>
                    <Avatar className="h-20 w-20 border-2 border-white">
                      <AvatarImage src={user.image ? urlFor(user.image).width(100).url() : undefined} alt={user.name} />
                      <AvatarFallback>{user.name ? user.name.charAt(0) : '?'}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-center">{user.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between p-4">
                    <div className="space-y-3 text-center">
                      <div>
                        <h3 className="font-semibold text-gray-600 dark:text-gray-300">الإنجاز الكلي</h3>
                        <p className="text-xl font-bold">{formatMinutes(user.totalMinutes)}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-600 dark:text-gray-300">إنجاز اليوم</h3>
                        <p className="text-lg font-bold">{formatMinutes(user.todayMinutes)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Leaderboard List Section --- */}
      <div className="w-full max-w-4xl mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {restOfUsers.map((user, index) => {
          const rank = index + 4; // Start rank from #4
          return (
            <Card key={user._id} className="w-full flex flex-row items-center p-3 gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <span className="text-xl font-bold text-gray-500 w-8">{`#${rank}`}</span>
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.image ? urlFor(user.image).width(100).url() : undefined} alt={user.name} />
                <AvatarFallback>{user.name ? user.name.charAt(0) : '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className="text-lg font-semibold">{user.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{formatMinutes(user.totalMinutes)}</p>
              </div>
            </Card>
          );
        })
        }
      </div>
    </div>
  );
};

export default AchievementCampPage;
