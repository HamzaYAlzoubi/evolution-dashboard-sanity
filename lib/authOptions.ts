// lib/authOptions.ts
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { sanityClient } from "@/sanity/lib/client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // تحقق من المستخدم في Sanity
        const query = `*[_type == 'user' && email == $email][0]`;
        const user = await sanityClient.fetch(query, { email: credentials?.email });
        if (!user) return null;
        // تحقق من كلمة المرور (يجب تشفيرها فعليًا)
        if (user.password !== credentials?.password) return null;
        return {
          id: user._id,
          email: user.email,
          name: user.name,
          dailyTarget: user.dailyTarget || 4,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};