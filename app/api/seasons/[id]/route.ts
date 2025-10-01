import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request
) {
  const url = new URL(req.url);
  const seasonId = url.pathname.split('/').pop();

  if (!seasonId) {
    return NextResponse.json({ success: false, error: "Season ID is required" }, { status: 400 });
  }

  try {
    await writeClient.delete(seasonId);

    return NextResponse.json({ success: true, message: "Season deleted successfully" });
  } catch (err) {
    console.error(`Failed to delete season ${seasonId}:`, err);
    return NextResponse.json({ success: false, error: `Failed to delete season ${seasonId}` }, { status: 500 });
  }
}
