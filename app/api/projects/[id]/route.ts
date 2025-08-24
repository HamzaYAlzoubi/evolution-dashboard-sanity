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
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  try {
    // First, fetch the project to get its sub-projects
    const project = await writeClient.fetch(`*[_id == $id][0]{ 'subProjects': subProjects[]->_id }`, { id });

    // If the project has sub-projects, delete them
    if (project && project.subProjects && project.subProjects.length > 0) {
      await Promise.all(project.subProjects.map((subId: string) => writeClient.delete(subId)));
    }

    // Then, remove the project reference from the user
    const user = await writeClient.fetch(`*[_type == 'user' && references($id)][0]{_id}`, { id });
    if (user) {
      await writeClient.patch(user._id).unset([`projects[_ref=="${id}"]`]).commit();
    }

    // Finally, delete the project itself
    await writeClient.delete(id!);
    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
