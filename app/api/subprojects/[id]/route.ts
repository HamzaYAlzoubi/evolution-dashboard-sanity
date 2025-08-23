import { writeClient } from "@/sanity/lib/write-client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const body = await req.json();
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  try {
    const result = await writeClient.patch(id!)
      .set({
        name: body.name,
        status: body.status,
        hours: body.hours,
        minutes: body.minutes,
      })
      .commit();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update sub-project" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  try {
    await writeClient.delete(id!);
    return NextResponse.json({ success: true, message: "Sub-project deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete sub-project" }, { status: 500 });
  }
}
