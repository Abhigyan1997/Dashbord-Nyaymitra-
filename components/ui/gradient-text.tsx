import type React from "react"
import { cn } from "@/lib/utils"

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "accent"
}

export function GradientText({ children, className, variant = "primary", ...props }: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r font-semibold",
        {
          "from-blue-400 via-purple-500 to-cyan-400": variant === "primary",
          "from-emerald-400 via-teal-500 to-blue-500": variant === "secondary",
          "from-orange-400 via-pink-500 to-red-500": variant === "accent",
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
