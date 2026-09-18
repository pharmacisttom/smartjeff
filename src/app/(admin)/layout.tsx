import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { Sidebar } from "@/components/layout/Sidebar";

export default function BackofficeAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Collapsible Desktop Sidebar */}
      <Sidebar />

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Admin TopBar with Home Button */}
        <AdminTopBar />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
