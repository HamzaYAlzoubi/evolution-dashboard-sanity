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
        ? `*[_type == 'project']{ _id, name, status, user->{ _id, name, email }, subProjects[]->{ _id, name }, _createdAt, _updatedAt }`
        : `*[_type == 'project' && user._ref == $userId]{ _id, name, status, user->{ _id, name, email }, subProjects[]->{ _id, name }, _createdAt, _updatedAt }`

    const projects = await sanityClient.fetch(query, {
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error("Projects fetch error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب المشاريع" },
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
    const { name, status } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: "اسم المشروع مطلوب" },
        { status: 400 }
      )
    }

    const result = await writeClient.create({
      _type: "project",
      name: name.trim(),
      status: status || "نشط",
      user: { _type: "reference", _ref: session.user.id },
      subProjects: [],
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: "تم إنشاء المشروع بنجاح",
    })
  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json(
      { success: false, error: "فشل في إنشاء المشروع" },
      { status: 500 }
    )
  }
}
