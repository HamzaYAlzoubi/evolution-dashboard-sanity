// lib/authOptions.ts
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import { sanityClient } from "@/sanity/lib/client"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const query = `*[_type == 'user' && email == $email][0]`
          const user = await sanityClient.fetch(query, {
            email: credentials.email,
          })

          if (!user) {
            return null
          }

          const passwordsMatch = await compare(
            credentials.password,
            user.password
          )

          if (!passwordsMatch) {
            return null
          }

          return {
            id: user._id,
            email: user.email,
            name: user.name,
            dailyTarget: user.dailyTarget || 4,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.dailyTarget = user.dailyTarget
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.dailyTarget = token.dailyTarget as number
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
