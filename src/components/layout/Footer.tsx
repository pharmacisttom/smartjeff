"use client";

export function Footer() {
  return (
    <>
      <footer className="w-full bg-surface-card border-t border-surface-border py-6 px-4 text-xs text-content-muted font-sans mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: App Copyright Info */}
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                S
              </div>
              <span className="font-bold text-content-primary">SMARTO</span>
            </div>
            <span className="hidden sm:inline text-surface-border">|</span>
            <span>J2K Housekeeping Management System v2.6</span>
          </div>

          <div className="flex items-center text-xs">
            <span>&copy; {new Date().getFullYear()} J2K. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </>
  );
}
