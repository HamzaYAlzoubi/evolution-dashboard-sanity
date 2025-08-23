// lib/authOptions.ts
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import { writeClient } from "@/sanity/lib/write-client"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials: Record<string, string> | undefined) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const query = `*[_type == 'user' && email == $email && isActive == true][0]`
          const user = await writeClient.fetch(query, {
            email: credentials.email.toLowerCase().trim(),
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

          // Update last login
          await writeClient
            .patch(user._id)
            .set({
              lastLogin: new Date().toISOString(),
            })
            .commit()

          return {
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.image,
            dailyTarget: user.dailyTarget || 4,
            role: user.role || "user",
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
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.dailyTarget = token.dailyTarget as number
        session.user.role = token.role as string
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // You can add additional logic here if needed
      console.log("User signed in:", user.email)
    },
    async signOut() {
      // You can add additional logic here if needed
      console.log("User signed out")
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
