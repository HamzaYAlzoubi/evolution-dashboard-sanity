import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const newSession = await writeClient.create({
      _type: "session",
      date: body.date,
      hours: body.hours,
      minutes: body.minutes,
      notes: body.notes,
      project: { _type: "reference", _ref: body.projectId },
    });

    await writeClient
      .patch(body.projectId)
      .setIfMissing({ sessions: [] })
      .append("sessions", [{ _type: "reference", _ref: newSession._id }])
      .commit();

    return NextResponse.json({ success: true, data: newSession });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 });
  }
}
