import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-surface-subtle">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-20 md:pb-6">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
