import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";

// PATCH /api/author/:id
export async function PATCH(req: Request) {
  const body = await req.json();
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  try {
    const result = await writeClient.patch(id!)
      .set({
        title: body.title,
        price: parseFloat(body.price),
        description: body.description,
      })
      .commit();

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/author/:id
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  try {
    await writeClient.delete(id!);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
