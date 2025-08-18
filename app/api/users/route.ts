import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const result = await writeClient.create({
      _type: "user",
      name: body.name,
      email: body.email,
      password: body.password, // يجب تشفيرها فعليًا
      dailyTarget: body.dailyTarget || 4,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}
