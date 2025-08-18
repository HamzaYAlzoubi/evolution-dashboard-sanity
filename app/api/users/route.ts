import { writeClient } from "@/sanity/lib/write-client";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password, dailyTarget } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    // Check if user with the same email already exists
    const existingUser = await writeClient.fetch(`*[_type == 'user' && email == $email][0]`, { email });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "User with this email already exists" }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create new user
    const result = await writeClient.create({
      _type: "user",
      name: name,
      email: email,
      password: hashedPassword,
      dailyTarget: dailyTarget || 4,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}
