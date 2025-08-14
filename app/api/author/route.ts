// app/api/products/route.ts
import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const result = await writeClient.create({
      _type: "author",
      id: body.id,
      name: body.name,
      username: body.username,
      email: body.email,
      img: body.img!,
      bio: body.bio,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}