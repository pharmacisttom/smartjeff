import { redirect } from "next/navigation";

export default function AdminIncidentsRedirectPage() {
  redirect("/admin/enterprise/qhse/incidents");
}
