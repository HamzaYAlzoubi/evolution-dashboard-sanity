import { writeClient } from "@/sanity/lib/write-client"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      )
    }

    const projectId = id

    const query = `
      *[_type == 'project' && _id == $projectId]{
        _id,
        name,
        status,
        user->{_id, name, email},
        "subProjects": subProjects[]->{
          _id,
          name,
          status,
          hours,
          minutes,
          project->{_id, name},
          "sessionCount": count(*[_type == "session" && project._ref == ^._id])
        }
      }[0]
    `

    const projectData = await writeClient.fetch(query, {
      projectId,
    })

    if (!projectData) {
      return NextResponse.json(
        { success: false, error: "المشروع غير موجود" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: projectData,
    })
  } catch (error) {
    console.error("Project fetch error (no cache):", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب المشروع" },
      { status: 500 }
    )
  }
}
