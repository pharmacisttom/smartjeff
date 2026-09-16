import React from "react";
import { cn } from "@/lib/utils";

interface SafeAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  top?: boolean;
  bottom?: boolean;
}

export function SafeArea({ children, top = true, bottom = true, className, ...props }: SafeAreaProps) {
  return (
    <div
      className={cn(
        top && "safe-pt",
        bottom && "safe-pb",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
