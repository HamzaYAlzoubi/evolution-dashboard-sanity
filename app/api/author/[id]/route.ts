import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/write-client";

// PATCH /api/author/:id
export async function PATCH(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const body = await req.json();

  try {
    const result = await writeClient.patch(id)
      .set({
        name: body.name,
        username: body.username,
        email: body.email,
        img: body.img,
        bio: body.bio,
      })
      .commit();

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update author" }, { status: 500 });
  }
}

// DELETE /api/author/:id
export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    await writeClient.delete(id);
    return NextResponse.json({ success: true, message: "Author deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete author" }, { status: 500 });
  }
}
