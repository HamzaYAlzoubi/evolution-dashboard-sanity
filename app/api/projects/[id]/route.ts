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

  if (!id) {
    return NextResponse.json({ success: false, error: "Project ID is missing" }, { status: 400 });
  }

  try {
    // 1. Find all related documents in one go
    const relatedDocs = await writeClient.fetch(
      `{
        "subProjectIds": *[_type == "subProject" && project._ref == $id]._id,
        "sessionIds": *[_type == "session" && (project._ref == $id || project._ref in *[_type == "subProject" && project._ref == $id]._id)]._id,
        "userId": *[_type == "user" && references($id)][0]._id
      }`,
      { id }
    );

    const { subProjectIds = [], sessionIds = [], userId } = relatedDocs;

    // 2. Build a transaction to perform all operations atomically
    let tx = writeClient.transaction();

    // 2a. Unset project reference from all related sessions
    if (sessionIds.length > 0) {
      sessionIds.forEach((sessionId: string) => {
        tx = tx.patch(sessionId, { unset: ["project"] });
      });
    }

    // 2b. Delete all sub-projects
    if (subProjectIds.length > 0) {
      subProjectIds.forEach((subId: string) => {
        tx = tx.delete(subId);
      });
    }
    
    // 2c. Remove the project reference from the user
    if (userId) {
      tx = tx.patch(userId, { unset: [`projects[_ref=="${id}"]`] });
    }

    // 2d. Delete the main project itself
    tx = tx.delete(id);

    // 3. Commit the transaction
    await tx.commit();

    return NextResponse.json({ success: true, message: "Project and its sub-projects deleted successfully. Sessions unlinked." });

  } catch (err) {
    console.error("Failed to delete project:", err);
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}