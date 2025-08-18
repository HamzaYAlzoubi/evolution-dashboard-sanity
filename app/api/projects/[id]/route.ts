import { writeClient } from "@/sanity/lib/write-client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { id } = params;
  try {
    const result = await writeClient.patch(id)
      .set({
        name: body.name,
        status: body.status,
        subProjects: body.subProjects,
      })
      .commit();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    await writeClient.delete(id);
    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
