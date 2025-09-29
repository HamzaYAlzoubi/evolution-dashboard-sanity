// lib/authOptions.ts
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import { sanityClient } from "@/sanity/lib/client"
import { urlFor } from "@/sanity/lib/image"
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
      if (token?.id) {
        session.user.id = token.id as string

        const query = `*[_type == 'user' && _id == $userId][0]`
        try {
          const latestUser = await sanityClient.fetch(query, { userId: token.id })
          if (latestUser) {
            session.user.name = latestUser.name
            session.user.image = latestUser.image ? urlFor(latestUser.image).width(100).url() : null
            session.user.dailyTarget = latestUser.dailyTarget
          }
        } catch (error) {
          console.error("Error fetching user data for session:", error)
        }
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
