import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    image?: string
    dailyTarget: number
    role: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      dailyTarget: number
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    dailyTarget: number
    role: string
  }
}
