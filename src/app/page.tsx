import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, verifyToken } from "@/lib/auth-jwt";

export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    const session = verifyToken(token);
    if (session) {
      if (["ADMIN", "SUPERADMIN", "SUPER_ADMIN", "HR", "FINANCE", "EXECUTIVE", "OPERATIONS"].includes(session.role)) {
        redirect("/admin/dashboard");
      } else {
        redirect("/check-in");
      }
    }
  }

  redirect("/login");
}
