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
    // First, remove the sub-project reference from the parent project
    const subProject = await writeClient.fetch(`*[_id == $id][0]{ 'project': project->_id }`, { id });
    if (subProject && subProject.project) {
      await writeClient.patch(subProject.project).unset([`subProjects[_ref=="${id}"]`]).commit();
    }

    // Finally, delete the sub-project itself
    await writeClient.delete(id!);
    return NextResponse.json({ success: true, message: "Sub-project deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete sub-project" }, { status: 500 });
  }
}