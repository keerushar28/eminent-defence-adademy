// lib/auth.ts (or auth/config.ts)
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id.toString(),
          name: user.username,
          email: user.email,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, trigger, user }) {
      // On sign in, user object is available
      if (trigger === "signIn" && user) {
        token.userId = user.id;
        token.isVerified = user.isVerified;
        token.role = user.role;
        return token;
      }

      // On subsequent requests, validate against database
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (!dbUser) {
          // User doesn't exist - clear all user-specific data from token
          // This effectively invalidates the session
          return {
            ...token,
            userId: undefined,
            isVerified: undefined,
            role: undefined,
            email: undefined,
          };
        }

        token.userId = dbUser.id.toString();
        token.isVerified = dbUser.isVerified;
        token.role = dbUser.role;
      }

      return token;
    },
    async session({ session, token }) {
      // Only populate session if token has valid user data
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
        session.user.isVerified = token.isVerified;
        session.user.role = token.role;
      } else {
        // No valid user data, return minimal session
        return {
          ...session,
          user: undefined,
        }; // This is safer since session structure is being preserved
      }
      return session;
    },
  },
};
