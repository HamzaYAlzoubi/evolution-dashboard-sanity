// lib/auth.ts
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return session
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/login")
  }

  return session
}

export async function getUserRole() {
  const session = await getServerSession(authOptions)
  return session?.user?.role || "user"
}

export async function isAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === "admin"
}

