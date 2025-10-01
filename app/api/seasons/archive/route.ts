import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

type Session = {
  date: string;
  hours: string;
  minutes: string;
};

type UserWithSessions = {
  _id: string;
  sessions: Session[];
};

export async function POST(req: Request) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Find finished seasons that haven't been archived yet
    const unarchivedSeasons = await writeClient.fetch(
      `*[_type == "season" && endDate < $today && !defined(champion)]`,
      { today }
    );

    if (unarchivedSeasons.length === 0) {
      return NextResponse.json({ success: true, message: "No new seasons to archive." });
    }

    // 2. Get all users and all their sessions
    const allUsers = await writeClient.fetch(`*[_type == "user"]{
      _id,
      "sessions": sessions[]->{date, hours, minutes}
    }`) as UserWithSessions[];

    let archivedCount = 0;
    let deletedCount = 0;

    // 3. Process each unarchived season
    for (const season of unarchivedSeasons) {
      const seasonStartDate = new Date(season.startDate);
      const seasonEndDate = new Date(season.endDate);
      
      const seasonResults: { userId: string; totalMinutes: number; livesLost: number }[] = [];

      for (const user of allUsers) {
        const sessionsInSeason = user.sessions?.filter(s => {
          if (!s.date) return false;
          const sessionDate = new Date(s.date);
          return sessionDate >= seasonStartDate && sessionDate <= seasonEndDate;
        }) || [];

        const totalMinutes = sessionsInSeason.reduce((acc, s) => acc + (Number(s.hours) || 0) * 60 + (Number(s.minutes) || 0), 0);

        const dailyTarget = 240;
        const sessionsByDay = new Map<string, number>();
        sessionsInSeason.forEach(s => {
            if(s.date) {
                sessionsByDay.set(s.date, (sessionsByDay.get(s.date) || 0) + ((Number(s.hours) || 0) * 60 + (Number(s.minutes) || 0)));
            }
        });

        let livesLost = 0;
        const dayCursor = new Date(seasonStartDate);
        while (dayCursor <= seasonEndDate) {
            const dateString = dayCursor.toISOString().split('T')[0];
            const achievedMinutes = sessionsByDay.get(dateString) || 0;
            if (achievedMinutes < dailyTarget) {
                livesLost++;
            }
            dayCursor.setDate(dayCursor.getDate() + 1);
        }
        
        seasonResults.push({ userId: user._id, totalMinutes, livesLost });
      }

      // 4. Determine Survivors FIRST
      const survivors = seasonResults.filter(user => user.livesLost < 3);

      // 5. Handle the "No Survivors" case or archive the results
      if (survivors.length === 0) {
        await writeClient.delete(season._id);
        deletedCount++;
      } else {
        const champion = survivors.reduce((max, user) => user.totalMinutes > max.totalMinutes ? user : max, survivors[0]);
        const finalSurvivorsList = survivors.filter(s => s.userId !== champion.userId);

        await writeClient
          .patch(season._id)
          .set({
            champion: { _type: 'reference', _ref: champion.userId },
            survivors: finalSurvivorsList.map(s => ({ _type: 'reference', _ref: s.userId, _key: s.userId }))
          })
          .commit();
        
        archivedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully archived ${archivedCount} and deleted ${deletedCount} season(s).` });

  } catch (err) {
    console.error("Failed to archive season(s):", err);
    return NextResponse.json({ success: false, error: "Failed to archive season(s)" }, { status: 500 });
  }
}
