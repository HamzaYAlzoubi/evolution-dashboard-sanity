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

  return (
    <div className="flex min-h-screen flex-col items-center p-8 md:p-16 lg:p-24">
      <h1 className="text-4xl font-bold mb-8">معسكر الإنجاز</h1>
      
      <div className="w-full max-w-6xl mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.length > 0 ? (
          users.map((user) => {
            // Calculate total achievement
            const totalMinutes = user.sessions?.reduce((acc, s) => {
              if (!s) return acc; // Guard against null/dangling references
              const hours = Number(s.hours || 0);
              const minutes = Number(s.minutes || 0);
              return acc + (hours * 60) + minutes;
            }, 0) || 0;

            // Calculate today's achievement
            const todayMinutes = user.sessions
              ?.filter(s => s && s.date === today) // Guard against null sessions in filter
              .reduce((acc, s) => {
                // s is guaranteed to be non-null here
                const hours = Number(s.hours || 0);
                const minutes = Number(s.minutes || 0);
                return acc + (hours * 60) + minutes;
              }, 0) || 0;

            return (
              <Card key={user._id} className="w-full flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.image ? urlFor(user.image).width(100).url() : undefined} alt={user.name} />
                    <AvatarFallback>{user.name ? user.name.charAt(0) : '?'}</AvatarFallback>
                  </Avatar>
                  <CardTitle>{user.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-600 dark:text-gray-300">الإنجاز الكلي</h3>
                      <p className="text-lg font-bold">{formatMinutes(totalMinutes)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-600 dark:text-gray-300">إنجاز اليوم</h3>
                      <p className="text-lg font-bold">{formatMinutes(todayMinutes)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="col-span-full text-center">لا يوجد مستخدمون لعرضهم.</p>
        )}
      </div>
    </div>
  );
};

export default AchievementCampPage;
