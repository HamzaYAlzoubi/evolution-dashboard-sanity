
import { NextResponse } from "next/server";
import { sanityClient } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";

const CHALLENGE_DURATION_DAYS = 30;
const DAILY_GOAL_SECONDS = 4 * 60 * 60; // 4 hours in seconds

// Helper to get the start of a given date
function getStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

export async function GET() {
  try {
    // 1. Define the date range for the challenge (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (CHALLENGE_DURATION_DAYS - 1));
    const challengeStart = getStartOfDay(startDate);

    // 2. Fetch all users and all relevant sessions in parallel
    const [users, sessions] = await Promise.all([
      sanityClient.fetch(`*[_type == "user"]{_id, name, image}`),
      sanityClient.fetch(
        `*[_type == "session" && startTime >= $challengeStart] {
          user->{_id},
          startTime,
          duration
        }`,
        { challengeStart: challengeStart.toISOString() }
      ),
    ]);

    // 3. Group sessions by user ID for efficient lookup
    const sessionsByUser = new Map<string, any[]>();
    for (const session of sessions) {
      if (session.user?._id) {
        if (!sessionsByUser.has(session.user._id)) {
          sessionsByUser.set(session.user._id, []);
        }
        sessionsByUser.get(session.user._id)?.push(session);
      }
    }

    // 4. Process data for each user
    const processedUsers = users.map((user: any) => {
      const userSessions = sessionsByUser.get(user._id) || [];
      const dailyProgress: { day: number; status: 'success' | 'fail' | 'pending' }[] = [];
      let failures = 0;

      for (let i = 0; i < CHALLENGE_DURATION_DAYS; i++) {
        const day = new Date(challengeStart);
        day.setDate(day.getDate() + i);
        const startOfDay = getStartOfDay(day);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        // Check if the day is in the future
        if (startOfDay > endDate) {
            dailyProgress.push({ day: i + 1, status: 'pending' });
            continue;
        }

        const durationForDay = userSessions
          .filter(s => {
            const sessionDate = new Date(s.startTime);
            return sessionDate >= startOfDay && sessionDate <= endOfDay;
          })
          .reduce((sum, s) => sum + (s.duration || 0), 0);

        if (durationForDay >= DAILY_GOAL_SECONDS) {
          dailyProgress.push({ day: i + 1, status: 'success' });
        } else {
          dailyProgress.push({ day: i + 1, status: 'fail' });
          failures++;
        }
      }

      // 5. Calculate current streak
      let currentStreak = 0;
      const todayIndex = Math.floor((getStartOfDay(endDate).getTime() - challengeStart.getTime()) / (1000 * 60 * 60 * 24));

      for (let i = todayIndex; i >= 0; i--) {
        if (dailyProgress[i]?.status === 'success') {
          currentStreak++;
        } else {
          break; // Streak is broken
        }
      }

      return {
        _id: user._id,
        name: user.name,
        image: user.image ? urlFor(user.image).width(100).url() : null,
        lives: Math.max(0, 3 - failures),
        isEliminated: failures > 3,
        dailyProgress,
        currentStreak,
      };
    });

    // Define the type for our processed user
    interface ProcessedUser {
        _id: string;
        name: string;
        image: string | null;
        lives: number;
        isEliminated: boolean;
        dailyProgress: { day: number; status: 'success' | 'fail' | 'pending' }[];
        currentStreak: number;
    }

    // Sort users by a meaningful metric, e.g., most lives, then highest streak
    processedUsers.sort((a: ProcessedUser, b: ProcessedUser) => {
        if (a.lives !== b.lives) {
            return b.lives - a.lives;
        }
        return b.currentStreak - a.currentStreak;
    });

    return NextResponse.json(processedUsers);

  } catch (error) {
    console.error("Error fetching camp status:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
