// lib/authOptions.ts
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { sanityClient } from "@/sanity/lib/client";
import { compare } from "bcryptjs";

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
          return null;
        }

        const query = `*[_type == 'user' && email == $email][0]`;
        const user = await sanityClient.fetch(query, { email: credentials.email });

        if (!user) {
          return null;
        }

        const passwordsMatch = await compare(credentials.password, user.password);

        if (!passwordsMatch) {
          return null;
        }

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