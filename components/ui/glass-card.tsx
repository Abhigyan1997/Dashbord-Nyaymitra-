import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "elevated" | "subtle"
}

export function GlassCard({ children, className, variant = "default", ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10",
        {
          "bg-slate-800/60 backdrop-blur-xl shadow-2xl border-slate-600/30": variant === "default",
          "bg-slate-800/70 backdrop-blur-2xl shadow-3xl border-slate-500/40": variant === "elevated",
          "bg-slate-800/40 backdrop-blur-lg shadow-lg border-slate-600/20": variant === "subtle",
        },
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-600/20 via-transparent to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
