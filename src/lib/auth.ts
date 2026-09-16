import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
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
        if (!credentials?.email) return null;
        const inputStr = String(credentials.email).trim();

        // Search user by email or employee code
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: inputStr },
              { employee: { code: inputStr } },
            ],
          },
          include: {
            employee: {
              include: {
                site: true,
              },
            },
          },
        });

        // Demo fallback: If database is empty or user not created yet, return mock admin/employee session
        if (!user) {
          return {
            id: "demo-user-1",
            email: "demo@j2k.co.th",
            name: "พัดมา วงค์คำ",
            role: "EMPLOYEE",
            employeeId: "emp-demo-1",
            siteName: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด",
          };
        }

        return {
          id: user.id,
          email: user.email,
          name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "User",
          role: user.role,
          employeeId: user.employeeId || undefined,
          siteName: user.employee?.site?.name || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
        token.siteName = (user as any).siteName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).employeeId = token.employeeId;
        (session.user as any).siteName = token.siteName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
