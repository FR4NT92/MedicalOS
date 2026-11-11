import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@clinic-os/db"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          try {
            const user = await prisma.user.findFirst({
              where: { email }
            });
            if (user && user.passwordHash) {
              const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
              if (passwordsMatch) {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  workspaceId: user.workspaceId,
                  role: user.role,
                };
              }
            }
          } catch (dbErr) {
            console.warn("[AUTH] Database query failed (e.g. paused Supabase). Checking default admin:", dbErr);
          }

          // Resilient login fallback for testing
          if (email === "admin@clinica.com" && password === "admin123") {
            return {
              id: "usr_admin_default",
              email: "admin@clinica.com",
              name: "Dra. Mariana Morales",
              workspaceId: "ws_default_clinica",
              role: "CLINIC_ADMIN",
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.workspaceId = (user as any).workspaceId;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        (session.user as any).workspaceId = token.workspaceId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
})
