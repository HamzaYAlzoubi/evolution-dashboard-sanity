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
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ success: false, error: "Session ID is missing" }, { status: 400 });
  }

  try {
    // Find documents that reference this session
    const refs = await writeClient.fetch(
      `{
        "userId": *[_type == "user" && references($id)][0]._id,
        "projectId": *[references($id) && (_type == "project" || _type == "subProject")][0]._id
      }`,
      { id }
    );

    const { userId, projectId } = refs;

    // Start a transaction
    let tx = writeClient.transaction();

    // Unlink from user
    if (userId) {
      tx = tx.patch(userId, { unset: [`sessions[_ref=="${id}"]`] });
    }

    // Unlink from project/sub-project
    if (projectId) {
      tx = tx.patch(projectId, { unset: [`sessions[_ref=="${id}"]`] });
    }

    // Delete the session itself
    tx = tx.delete(id);

    // Commit the transaction
    await tx.commit();

    return NextResponse.json({ success: true, message: "Session deleted successfully" });

  } catch (err) {
    console.error("Failed to delete session:", err);
    return NextResponse.json({ success: false, error: "Failed to delete session" }, { status: 500 });
  }
}