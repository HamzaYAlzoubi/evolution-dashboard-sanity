import { writeClient } from "@/sanity/lib/write-client"
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول" },
        { status: 403 }
      )
    }

    const users = await writeClient.fetch(`
      *[_type == 'user'] {
        _id,
        name,
        email,
        dailyTarget,
        role,
        isActive,
        lastLogin,
        createdAt,
        _createdAt,
        _updatedAt
      }
    `)

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, dailyTarget } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "جميع الحقول مطلوبة" },
        { status: 400 }
      )
    }

    // Validate name length
    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "الاسم يجب أن يكون حرفين على الأقل" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني غير صحيح" },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      )
    }

    // Check if user with the same email already exists
    const existingUser = await writeClient.fetch(
      `*[_type == 'user' && email == $email][0]`,
      { email: email.toLowerCase().trim() }
    )

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hash(password, 12)

    // Create new user
    const result = await writeClient.create({
      _type: "user",
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      dailyTarget: dailyTarget || 4,
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result

    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
        message: "تم إنشاء الحساب بنجاح",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    )
  }
}
