import { writeClient } from "@/sanity/lib/write-client"
import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      )
    }

    const user = await writeClient.fetch(
      `
      *[_type == 'user' && _id == $id][0] {
        _id,
        name,
        email,
        dailyTarget,
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
    const body = await req.json()
    const { name, email, password, dailyTarget } = body

    const id = req.nextUrl.pathname.split("/").pop()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
        { status: 400 }
      )
    }

    const updateData: any = {}

    if (name) {
      updateData.name = name.trim()
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: "البريد الإلكتروني غير صحيح" },
          { status: 400 }
        )
      }
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
      updateData.email = email.toLowerCase().trim()
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
          { status: 400 }
        )
      }
      updateData.password = await hash(password, 12)
    }

    if (dailyTarget !== undefined) {
        if (typeof dailyTarget !== 'number' || dailyTarget < 0) {
            return NextResponse.json(
                { success: false, error: "قيمة الهدف اليومي غير صالحة" },
                { status: 400 }
            );
        }
        updateData.dailyTarget = dailyTarget;
    }

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
            { success: false, error: "لا توجد بيانات للتحديث" },
            { status: 400 }
        );
    }

    const result = await writeClient.patch(id).set(updateData).commit()

    const { password: _, ...userWithoutPassword } = result

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
    const id = req.nextUrl.pathname.split("/").pop()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المستخدم مطلوب" },
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
