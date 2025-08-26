import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const result = await writeClient.create({
      _type: "subProject",
      name: body.name,
      status: body.status,
      project: { _type: "reference", _ref: body.projectId },
    });

    await writeClient
      .patch(body.projectId)
      .setIfMissing({ subProjects: [] })
      .append('subProjects', [{ _type: 'reference', _ref: result._id, _key: crypto.randomUUID() }])
      .commit();

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to create sub-project" }, { status: 500 });
  }
}
