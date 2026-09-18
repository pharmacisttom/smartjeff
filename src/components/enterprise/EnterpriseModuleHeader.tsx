import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface EnterpriseModuleHeaderProps {
  badge: string;
  title: string;
  description?: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: ReactNode;
}

export function EnterpriseModuleHeader({
  badge,
  title,
  description,
  subtitle,
  breadcrumbs,
  actions,
}: EnterpriseModuleHeaderProps) {
  const displayDescription = description || subtitle;

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-content-muted">
        <Link href="/admin/dashboard" className="hover:text-brand-600 flex items-center">
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>แดชบอร์ด</span>
        </Link>
        {breadcrumbs.map((b, i) => (
          <div key={i} className="flex items-center space-x-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {b.href ? (
              <Link href={b.href} className="hover:text-brand-600 transition-colors">
                {b.label}
              </Link>
            ) : (
              <span className="text-content-primary font-medium">{b.label}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-1.5 uppercase">
            {badge}
          </div>
          <h1 className="text-2xl font-black text-content-primary tracking-tight">
            {title}
          </h1>
          {displayDescription && (
            <p className="text-xs text-content-secondary mt-1 max-w-3xl">
              {displayDescription}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center space-x-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnterpriseModuleHeader;
