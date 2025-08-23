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
        { success: false, error: "معرف الجلسة مطلوب" },
        { status: 400 }
      )
    }

    const query =
      session.user.role === "admin"
        ? `*[_type == 'session' && _id == $id][0]{ _id, date, hours, minutes, notes, user->{ _id, name, email }, project->{ _id, name }, _createdAt, _updatedAt }`
        : `*[_type == 'session' && _id == $id && user._ref == $userId][0]{ _id, date, hours, minutes, notes, user->{ _id, name, email }, project->{ _id, name }, _createdAt, _updatedAt }`

    const sessionData = await sanityClient.fetch(query, {
      id,
      userId: session.user.id,
    })

    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "الجلسة غير موجودة أو غير مصرح لك" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: sessionData,
    })
  } catch (error) {
    console.error("Session fetch error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب الجلسة" },
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
        { success: false, error: "معرف الجلسة مطلوب" },
        { status: 400 }
      )
    }

    // Check if user owns this session or is admin
    if (session.user.role !== "admin") {
      const sessionData = await sanityClient.fetch(
        `*[_type == 'session' && _id == $id && user._ref == $userId][0]`,
        { id, userId: session.user.id }
      )

      if (!sessionData) {
        return NextResponse.json(
          { success: false, error: "الجلسة غير موجودة أو غير مصرح لك" },
          { status: 403 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}

    if (body.date) {
      updateData.date = body.date
    }

    if (body.hours !== undefined) {
      if (body.hours < 0 || body.hours > 24) {
        return NextResponse.json(
          { success: false, error: "ساعات العمل يجب أن تكون بين 0 و 24" },
          { status: 400 }
        )
      }
      updateData.hours = body.hours
    }

    if (body.minutes !== undefined) {
      if (body.minutes < 0 || body.minutes > 59) {
        return NextResponse.json(
          { success: false, error: "الدقائق يجب أن تكون بين 0 و 59" },
          { status: 400 }
        )
      }
      updateData.minutes = body.minutes
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }

    if (body.projectId) {
      // Verify that the project belongs to the user or user is admin
      if (session.user.role !== "admin") {
        const project = await sanityClient.fetch(
          `*[_type == 'project' && _id == $projectId && user._ref == $userId][0]`,
          { projectId: body.projectId, userId: session.user.id }
        )

        if (!project) {
          return NextResponse.json(
            { success: false, error: "المشروع غير موجود أو غير مصرح لك" },
            { status: 403 }
          )
        }
      }
      updateData.project = { _type: "reference", _ref: body.projectId }
    }

    const result = await writeClient.patch(id).set(updateData).commit()

    return NextResponse.json({
      success: true,
      data: result,
      message: "تم تحديث الجلسة بنجاح",
    })
  } catch (error) {
    console.error("Session update error:", error)
    return NextResponse.json(
      { success: false, error: "فشل في تحديث الجلسة" },
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
        { success: false, error: "معرف الجلسة مطلوب" },
        { status: 400 }
      )
    }

    // Check if user owns this session or is admin
    if (session.user.role !== "admin") {
      const sessionData = await sanityClient.fetch(
        `*[_type == 'session' && _id == $id && user._ref == $userId][0]`,
        { id, userId: session.user.id }
      )

      if (!sessionData) {
        return NextResponse.json(
          { success: false, error: "الجلسة غير موجودة أو غير مصرح لك" },
          { status: 403 }
        )
      }
    }

    await writeClient.delete(id)

    return NextResponse.json({
      success: true,
      message: "تم حذف الجلسة بنجاح",
    })
  } catch (error) {
    console.error("Session deletion error:", error)
    return NextResponse.json(
      { success: false, error: "فشل في حذف الجلسة" },
      { status: 500 }
    )
  }
}
