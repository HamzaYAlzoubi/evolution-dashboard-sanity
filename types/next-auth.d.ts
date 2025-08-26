import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Project {
    _id: string
    name: string
    status: string
    subProjects: SubProject[]
  }

  interface SubProject {
    _id: string
    name: string
    status: string
    hours: number
    minutes: number
  }

  interface SessionData {
    _id: string
    date: string
    hours: number
    minutes: number
    notes: string
    project: { _id: string; name: string }
  }

  interface User extends DefaultUser {
    id: string
    dailyTarget?: number
    projects?: Project[]
    sessions?: SessionData[]
  }

  interface Session extends DefaultSession {
    user: {
      id: string
      dailyTarget?: number
      projects?: Project[]
      sessions?: SessionData[]
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    dailyTarget?: number
    projects?: import("next-auth").Project[]
    sessions?: import("next-auth").SessionData[]
  }
}
