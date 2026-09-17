import { ApplicationShell } from "@/components/layout/ApplicationShell";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApplicationShell employeeMode>{children}</ApplicationShell>;
}
