import { writeClient } from "@/sanity/lib/write-client"
import { sanityClient } from "@/sanity/lib/client"
import { NextRequest, NextResponse } from "next/server"
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
        { success: false, error: "معرف المشروع الفرعي مطلوب" },
        { status: 400 }
      )
    }

    const query =
      session.user.role === "admin"
        ? `*[_type == 'subProject' && _id == $id][0]{ _id, name, status, hours, minutes, project->{ _id, name }, _createdAt, _updatedAt }`
        : `*[_type == 'subProject' && _id == $id && project->user._ref == $userId][0]{ _id, name, status, hours, minutes, project->{ _id, name }, _createdAt, _updatedAt }`

    const subProject = await sanityClient.fetch(query, {
      id,
      userId: session.user.id,
    })

    if (!subProject) {
      return NextResponse.json(
        { success: false, error: "المشروع الفرعي غير موجود أو غير مصرح لك" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: subProject,
    })
  } catch (error) {
    console.error("SubProject fetch error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب المشروع الفرعي" },
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
    const id = req.nextUrl.pathname.split("/").pop()

    if (!id) {
      return NextResponse.json(
        { success: false, error: "معرف المشروع الفرعي مطلوب" },
        { status: 400 }
      )
    }

    // Check if user owns this subproject or is admin
    if (session.user.role !== "admin") {
      const subProject = await sanityClient.fetch(
        `*[_type == 'subProject' && _id == $id && project->user._ref == $userId][0]`,
        { id, userId: session.user.id }
      )

      if (!subProject) {
        return NextResponse.json(
          { success: false, error: "المشروع الفرعي غير موجود أو غير مصرح لك" },
          { status: 403 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}

    if (body.name) {
      if (body.name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "اسم المشروع الفرعي مطلوب" },
          { status: 400 }
        )
      }
      updateData.name = body.name.trim()
    }

    if (body.status) {
      updateData.status = body.status
    }

    if (body.hours !== undefined) {
      updateData.hours = body.hours
    }

    if (body.minutes !== undefined) {
      updateData.minutes = body.minutes
    }

    const result = await writeClient.patch(id).set(updateData).commit()

    return NextResponse.json({
      success: true,
      data: result,
      message: "تم تحديث المشروع الفرعي بنجاح",
    })
  } catch (error) {
    console.error("SubProject update error:", error)
    return NextResponse.json(
      { success: false, error: "فشل في تحديث المشروع الفرعي" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
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
        { success: false, error: "معرف المشروع الفرعي مطلوب" },
        { status: 400 }
      )
    }

    // Check if user owns this subproject or is admin
    if (session.user.role !== "admin") {
      const subProject = await sanityClient.fetch(
        `*[_type == 'subProject' && _id == $id && project->user._ref == $userId][0]`,
        { id, userId: session.user.id }
      )

      if (!subProject) {
        return NextResponse.json(
          { success: false, error: "المشروع الفرعي غير موجود أو غير مصرح لك" },
          { status: 403 }
        )
      }
    }

    await writeClient.delete(id)

    return NextResponse.json({
      success: true,
      message: "تم حذف المشروع الفرعي بنجاح",
    })
  } catch (error) {
    console.error("SubProject deletion error:", error)
    return NextResponse.json(
      { success: false, error: "فشل في حذف المشروع الفرعي" },
      { status: 500 }
    )
  }
}
