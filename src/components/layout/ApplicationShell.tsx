import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function ApplicationShell({ children, employeeMode = false }: { children: React.ReactNode; employeeMode?: boolean }) {
  return <div className="flex min-h-screen bg-surface-subtle"><Sidebar /><div className="flex min-h-screen min-w-0 flex-1 flex-col pb-20 md:pb-6"><TopBar /><main className="mx-auto w-full max-w-[1600px] flex-1 p-4 md:p-6">{children}</main></div>{employeeMode && <BottomNav />}</div>;
}
