"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { Calendar, User, Scale, Settings, LogOut, Menu, Bell, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { GradientText } from "@/components/ui/gradient-text"
import { authUtils } from "@/lib/auth"

interface DashboardLayoutProps {
  children: React.ReactNode
  userType: "user" | "lawyer"
  user?: {  // Add the ? to make it optional
    name: string
    email: string
    avatar?: string
  }
}

export function DashboardLayout({ children, userType, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  const userNavItems = [
    { href: "/user/dashboard", label: "Dashboard", icon: User },
    { href: "/user/bookings", label: "My Bookings", icon: Calendar },
    { href: "/user/lawyers", label: "Find Lawyers", icon: Scale },
    { href: "/user/settings", label: "Settings", icon: Settings },
  ]

  const lawyerNavItems = [
    { href: "/lawyer/dashboard", label: "Dashboard", icon: User },
    { href: "/lawyer/consultations", label: "Consultations", icon: Calendar },
    { href: "/lawyer/profile", label: "Profile", icon: Scale },
    { href: "/lawyer/settings", label: "Settings", icon: Settings },
  ]

  const navItems = userType === "user" ? userNavItems : lawyerNavItems

  const NavContent = () => (
    <div className="flex flex-col h-full relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

      <div className="relative z-10 p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Scale className="h-8 w-8 text-blue-400" />
            <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-full" />
          </div>
          <GradientText className="text-xl font-bold">NyayMitra</GradientText>
        </div>
      </div>

      <nav className="flex-1 px-4 pb-4 relative z-10">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/25"
                    : "text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/10 border border-transparent"
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon
                    className={`h-5 w-5 transition-all duration-300 ${isActive ? "text-blue-400" : "group-hover:text-blue-400"}`}
                  />
                  {item.label}
                  {isActive && <Sparkles className="h-4 w-4 text-blue-400 ml-auto" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )

  const handleLogout = () => {
    authUtils.removeToken()
    router.push("/auth/login")
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col relative">
        <GlassCard className="h-full m-4 border-white/10">
          <NavContent />
        </GlassCard>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-slate-900/95 backdrop-blur-xl border-white/10">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="relative z-20">
          <GlassCard className="m-4 mb-0 border-white/10">
            <div className="flex h-16 items-center gap-4 px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-white hover:bg-white/10 border border-white/10"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
              </Sheet>

              <div className="flex-1 flex items-center gap-4">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-blue-400/25"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-white hover:bg-white/10 border border-white/10"
                >
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-pink-500 border-0">
                    3
                  </Badge>
                </Button>

                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-white">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-slate-400">
                      {user?.email || "No email"}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </div>
            </div>
          </GlassCard>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 pt-0 relative z-10">{children}</main>
      </div>
    </div>
  )
}
