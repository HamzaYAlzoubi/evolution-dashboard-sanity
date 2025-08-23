import { writeClient } from "@/sanity/lib/write-client"
import { sanityClient } from "@/sanity/lib/client"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      )
    }

    const query =
      session.user.role === "admin"
        ? `*[_type == 'session']{ _id, date, hours, minutes, notes, user->{ _id, name, email }, project->{ _id, name }, _createdAt, _updatedAt } | order(date desc)`
        : `*[_type == 'session' && user._ref == $userId]{ _id, date, hours, minutes, notes, user->{ _id, name, email }, project->{ _id, name }, _createdAt, _updatedAt } | order(date desc)`

    const sessions = await sanityClient.fetch(query, {
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      data: sessions,
    })
  } catch (error) {
    console.error("Sessions fetch error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب الجلسات" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log("Session creation request body:", body)
    const { date, hours, minutes, notes, projectId } = body

    console.log("Extracted values:", { date, hours, minutes, notes, projectId })

    if (!date || !projectId) {
      console.log("Validation failed: missing date or projectId")
      return NextResponse.json(
        { success: false, error: "التاريخ ومعرف المشروع مطلوبان" },
        { status: 400 }
      )
    }

    // Validate hours and minutes
    console.log("Validating hours and minutes:", { hours, minutes })
    if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
      console.log("Validation failed: invalid hours or minutes")
      return NextResponse.json(
        { success: false, error: "الساعات والدقائق يجب أن تكون صحيحة" },
        { status: 400 }
      )
    }

    // Verify that the project belongs to the user or user is admin
    console.log(
      "Checking project authorization for user:",
      session.user.id,
      "role:",
      session.user.role
    )
    if (session.user.role !== "admin") {
      const project = await sanityClient.fetch(
        `*[_type == 'project' && _id == $projectId && user._ref == $userId][0]`,
        { projectId, userId: session.user.id }
      )

      console.log("Project authorization check result:", project)

      if (!project) {
        console.log("Project authorization failed")
        return NextResponse.json(
          { success: false, error: "المشروع غير موجود أو غير مصرح لك" },
          { status: 403 }
        )
      }
    }

    const result = await writeClient.create({
      _type: "session",
      date,
      hours: hours || 0,
      minutes: minutes || 0,
      notes: notes || "",
      user: { _type: "reference", _ref: session.user.id },
      project: { _type: "reference", _ref: projectId },
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: "تم إنشاء الجلسة بنجاح",
    })
  } catch (error) {
    console.error("Session creation error:", error)
    return NextResponse.json(
      { success: false, error: "فشل في إنشاء الجلسة" },
      { status: 500 }
    )
  }
}
