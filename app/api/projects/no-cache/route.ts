import { writeClient } from "@/sanity/lib/write-client"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import {
  USER_PROJECTS_WITH_SUBPROJECTS_QUERY,
  PROJECTS_WITH_SUBPROJECTS_QUERY,
} from "@/sanity/lib/queries"

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
        ? PROJECTS_WITH_SUBPROJECTS_QUERY
        : USER_PROJECTS_WITH_SUBPROJECTS_QUERY

    const projectsData = await writeClient.fetch(
      query,
      session.user.role !== "admin" ? { userId: session.user.id } : {}
    )

    return NextResponse.json({
      success: true,
      data: projectsData,
    })
  } catch (error) {
    console.error("Projects fetch error (no cache):", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب المشاريع" },
      { status: 500 }
    )
  }
}
