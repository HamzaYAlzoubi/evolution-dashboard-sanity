import { writeClient } from "@/sanity/lib/write-client"
import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      )
    }

    const id = req.nextUrl.pathname.split("/").pop()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      )
    }

    // Users can only view their own profile unless they're admin
    if (session.user.role !== "admin" && session.user.id !== id) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول" },
        { status: 403 }
      )
    }

    const user = await writeClient.fetch(
      `
      *[_type == 'user' && _id == $id][0] {
        _id,
        name,
        email,
        image,
        dailyTarget,
        role,
        isActive,
        lastLogin,
        createdAt,
        _createdAt,
        _updatedAt
      }
    `,
      { id }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("User fetch error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, email, password, dailyTarget } = body

    // Extract ID from URL
    const id = req.nextUrl.pathname.split("/").pop()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      )
    }

    // Users can only update their own profile unless they're admin
    if (session.user.role !== "admin" && session.user.id !== id) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالتحديث" },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "الاسم والبريد الإلكتروني مطلوبان" },
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

    // Check if email is already taken by another user
    const existingUser = await writeClient.fetch(
      `*[_type == 'user' && email == $email && _id != $id][0]`,
      { email: email.toLowerCase().trim(), id }
    )

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 409 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      dailyTarget: dailyTarget || 4,
    }

    // Hash password if provided
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
          { status: 400 }
        )
      }
      updateData.password = await hash(password, 12)
    }

    const result = await writeClient.patch(id).set(updateData).commit()

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _removedPassword, ...userWithoutPassword } = result

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: "تم تحديث البيانات بنجاح",
    })
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء تحديث البيانات" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالحذف" },
        { status: 403 }
      )
    }

    const id = req.nextUrl.pathname.split("/").pop()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      )
    }

    // Prevent admin from deleting themselves
    if (session.user.id === id) {
      return NextResponse.json(
        { success: false, error: "لا يمكنك حذف حسابك الخاص" },
        { status: 400 }
      )
    }

    await writeClient.delete(id)
    return NextResponse.json({
      success: true,
      message: "تم حذف المستخدم بنجاح",
    })
  } catch (error) {
    console.error("User deletion error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء حذف المستخدم" },
      { status: 500 }
    )
  }
}
