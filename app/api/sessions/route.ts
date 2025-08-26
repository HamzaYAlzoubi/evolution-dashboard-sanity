import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    // Create the new session document
    const newSession = await writeClient.create({
      _type: "session",
      date: body.date,
      hours: body.hours,
      minutes: body.minutes,
      notes: body.notes,
      project: { _type: "reference", _ref: body.projectId },
    });

    // Fetch the user associated with the project
    const project = await writeClient.fetch(`*[_id == $projectId][0]{ user->{_id} }`, { projectId: body.projectId });
    const userId = project?.user?._id;

    // Start a transaction to update both the project and the user
    let tx = writeClient.transaction();

    // 1. Append the session to the project's sessions array
    tx = tx.patch(body.projectId, (p) =>
      p.setIfMissing({ sessions: [] })
       .append("sessions", [{ _type: "reference", _ref: newSession._id, _key: crypto.randomUUID() }])
    );

    // 2. If a user is linked to the project, append the session to the user's sessions array
    if (userId) {
      tx = tx.patch(userId, (p) =>
        p.setIfMissing({ sessions: [] })
         .append("sessions", [{ _type: "reference", _ref: newSession._id, _key: crypto.randomUUID() }])
      );
    }

    // Commit the transaction
    await tx.commit();

    return NextResponse.json({ success: true, data: newSession });
  } catch (err) {
    console.error("Failed to create session:", err);
    return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 });
  }
}
