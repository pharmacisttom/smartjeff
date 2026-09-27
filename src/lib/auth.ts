import NextAuth from "next-auth";
// Local authentication is handled exclusively by /api/auth/login and sj_token.
// Do not create a second credentials path that skips MFA/session revocation.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
