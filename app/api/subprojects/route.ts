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
        ? `*[_type == 'subProject']{ _id, name, status, hours, minutes, project->{ _id, name }, _createdAt, _updatedAt }`
        : `*[_type == 'subProject' && project->user._ref == $userId]{ _id, name, status, hours, minutes, project->{ _id, name }, _createdAt, _updatedAt }`

    const subProjects = await sanityClient.fetch(query, {
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      data: subProjects,
    })
  } catch (error) {
    console.error("SubProjects fetch error:", error)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء جلب المشاريع الفرعية" },
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
    const { name, status, hours, minutes, projectId } = body

    if (!name || !projectId) {
      return NextResponse.json(
        { success: false, error: "الاسم ومعرف المشروع مطلوبان" },
        { status: 400 }
      )
    }

    // Verify that the project belongs to the user or user is admin
    if (session.user.role !== "admin") {
      const project = await sanityClient.fetch(
        `*[_type == 'project' && _id == $projectId && user._ref == $userId][0]`,
        { projectId, userId: session.user.id }
      )

      if (!project) {
        return NextResponse.json(
          { success: false, error: "المشروع غير موجود أو غير مصرح لك" },
          { status: 403 }
        )
      }
    }

    // Create the subproject first
    const subProjectResult = await writeClient.create({
      _type: "subProject",
      name: name.trim(),
      status: status || "نشط",
      hours: hours || 0,
      minutes: minutes || 0,
      project: { _type: "reference", _ref: projectId },
    })

    // Verify the parent project exists and update it
    const parentProject = await sanityClient.fetch(
      `*[_type == 'project' && _id == $projectId][0]`,
      { projectId }
    )

    if (parentProject) {
      // Get existing subprojects and add the new one
      const currentSubProjects = parentProject.subProjects || []

      // Create the updated subprojects array
      const updatedSubProjects = [
        ...currentSubProjects.map((sp: { _ref?: string; _id?: string }) => ({
          _type: "reference",
          _ref: sp._ref || sp._id,
        })),
        { _type: "reference", _ref: subProjectResult._id },
      ]

      // Update the parent project
      await writeClient
        .patch(projectId)
        .set({ subProjects: updatedSubProjects })
        .commit()

      return NextResponse.json({
        success: true,
        data: {
          ...subProjectResult,
          project: { _id: projectId, name: parentProject.name },
        },
        message: "تم إنشاء المشروع الفرعي وربطه بالمشروع الأصلي بنجاح",
      })
    } else {
      // If parent project not found, delete the created subproject and return error
      await writeClient.delete(subProjectResult._id)
      return NextResponse.json(
        {
          success: false,
          error: "المشروع الأصلي غير موجود",
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("SubProject creation error:", error)
    return NextResponse.json(
      { success: false, error: "فشل في إنشاء المشروع الفرعي" },
      { status: 500 }
    )
  }
}
