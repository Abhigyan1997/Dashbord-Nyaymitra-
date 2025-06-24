"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authUtils } from "@/lib/auth"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: "user" | "lawyer"
}

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authUtils.isAuthenticated()
      const user = authUtils.getUser()

      if (!isAuthenticated || !user) {
        router.push("/auth/login")
        return
      }

      if (requiredUserType && user.userType !== requiredUserType) {
        // Redirect to appropriate dashboard
        if (user.userType === "user") {
          router.push("/user/dashboard")
        } else {
          router.push("/lawyer/dashboard")
        }
        return
      }

      setAuthorized(true)
      setLoading(false)
    }

    checkAuth()
  }, [router, requiredUserType])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
