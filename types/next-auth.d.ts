import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    dailyTarget: number
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      dailyTarget: number
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    dailyTarget: number
  }
}
