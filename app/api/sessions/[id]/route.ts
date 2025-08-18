import { writeClient } from "@/sanity/lib/write-client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const body = await req.json();
    const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  try {
    const result = await writeClient.patch(id!)
      .set({
        date: body.date,
        hours: body.hours,
        minutes: body.minutes,
        notes: body.notes,
        project: { _type: "reference", _ref: body.projectId },
      })
      .commit();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update session" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    const url = new URL(req.url);
  const id = url.pathname.split("/").pop();  try {
    await writeClient.delete(id!);
    return NextResponse.json({ success: true, message: "Session deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete session" }, { status: 500 });
  }
}
