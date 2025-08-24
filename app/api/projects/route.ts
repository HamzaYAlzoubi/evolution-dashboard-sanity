import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const result = await writeClient.create({
      _type: "project",
      name: body.name,
      status: body.status,
      user: { _type: "reference", _ref: body.userId },
      subProjects: [],
    });

    await writeClient
      .patch(body.userId)
      .setIfMissing({ projects: [] })
      .append('projects', [{ _type: 'reference', _ref: result._id }])
      .commit();

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 });
  }
}

