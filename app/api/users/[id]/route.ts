import { writeClient } from "@/sanity/lib/write-client";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { id } = params;
  try {
    const result = await writeClient.patch(id)
      .set({
        name: body.name,
        email: body.email,
        password: body.password,
        dailyTarget: body.dailyTarget,
      })
      .commit();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
      const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  try {
    await writeClient.delete(id!);
    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}