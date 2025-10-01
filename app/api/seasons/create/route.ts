import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, startDate, endDate } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Validation: Check for overlapping seasons
    const overlappingSeasons = await writeClient.fetch(
      `*[_type == "season" && !(_id in path("drafts.**")) && ((startDate <= $endDate && endDate >= $startDate))]`,
      { startDate, endDate }
    );

    if (overlappingSeasons.length > 0) {
      const conflictingSeason = overlappingSeasons[0];
      return NextResponse.json(
        { success: false, error: `Date range overlaps with existing season: "${conflictingSeason.name}" (${conflictingSeason.startDate} to ${conflictingSeason.endDate})` },
        { status: 409 } // 409 Conflict
      );
    }

    const newSeason = await writeClient.create({
      _type: "season",
      name,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, data: newSeason });
  } catch (err) {
    console.error("Failed to create season:", err);
    return NextResponse.json({ success: false, error: "Failed to create season" }, { status: 500 });
  }
}
