"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale, Users, Briefcase } from "lucide-react"
import { authUtils } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = authUtils.getUser()
    if (user) {
      // Redirect authenticated users to their dashboard
      if (user.userType === "user") {
        router.push("/user/dashboard")
      } else {
        router.push("/lawyer/dashboard")
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-12 w-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">NyayMitra</h1>
          </div>
          <p className="text-xl text-slate-200 max-w-2xl mx-auto">
            Connect with qualified lawyers for professional legal consultations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow bg-slate-800/80 backdrop-blur-xl border-slate-600/30 shadow-xl">
            <CardHeader className="text-center">
              <Users className="h-16 w-16 mx-auto text-blue-400 mb-4" />
              <CardTitle className="text-white text-xl">User Dashboard</CardTitle>
              <CardDescription className="text-slate-200">
                Book consultations, manage appointments, and track your legal matters
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  Access User Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-slate-800/80 backdrop-blur-xl border-slate-600/30 shadow-xl">
            <CardHeader className="text-center">
              <Briefcase className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
              <CardTitle className="text-white text-xl">Lawyer Dashboard</CardTitle>
              <CardDescription className="text-slate-200">
                Manage consultations, track earnings, and grow your practice
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
                >
                  Access Lawyer Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-slate-500">Professional legal consultation platform</p>
        </div>
      </div>
    </div>
  )
}
