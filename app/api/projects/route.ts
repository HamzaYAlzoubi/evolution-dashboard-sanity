import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("--- Received request to create project ---");
  try {
    const body = await req.json();
    console.log("Request body:", body);

    if (!body.userId) {
      console.error("Error: userId is missing from the request body.");
      return NextResponse.json({ success: false, error: "userId is missing" }, { status: 400 });
    }

    console.log("Creating project in Sanity...");
    const result = await writeClient.create({
      _type: "project",
      name: body.name,
      status: body.status,
      user: { _type: "reference", _ref: body.userId },
      subProjects: [],
    });
    console.log("Project created successfully:", result);

    console.log(`Patching user ${body.userId} to add project reference...`);
    await writeClient
      .patch(body.userId)
      .setIfMissing({ projects: [] })
      .append('projects', [{ _type: 'reference', _ref: result._id }])
      .commit();
    console.log("User patched successfully.");

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("--- Error creating project ---", err);
    return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 });
  }
}