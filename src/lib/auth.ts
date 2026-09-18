import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email / Employee Code", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const identifier = String(credentials.email).trim();
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier.toLowerCase() },
              { employee: { code: identifier } },
            ],
          },
          include: { employee: { include: { site: true } } },
        });

        if (!user?.passwordHash || !user.isActive || user.isLocked) return null;
        if (!(await bcrypt.compare(String(credentials.password), user.passwordHash))) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? (user.employee
            ? `${user.employee.firstName} ${user.employee.lastName}`
            : user.email),
          role: user.role,
          employeeId: user.employeeId ?? undefined,
          siteName: user.employee?.site?.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.employeeId = (user as { employeeId?: string }).employeeId;
        token.siteName = (user as { siteName?: string }).siteName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { role?: unknown }).role = token.role;
        (session.user as typeof session.user & { employeeId?: unknown }).employeeId = token.employeeId;
        (session.user as typeof session.user & { siteName?: unknown }).siteName = token.siteName;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
