export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const body = await req.json();

  try {
    const result = await writeClient.patch(params.id)
      .set({
        title: body.title,
        price: parseFloat(body.price),
        description: body.description,
      })
      .commit();

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;

  try {
    await writeClient.delete(params.id);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
