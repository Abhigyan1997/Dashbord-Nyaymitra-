"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Video,
  UserIcon,
  Star,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Users,
  Award,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { FloatingCard } from "@/components/ui/floating-card"
import { GradientText } from "@/components/ui/gradient-text"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { lawyerApi } from "@/lib/api"
import { auth } from "@/lib/auth"

interface Consultation {
  _id: string
  id: string
  clientName: string
  clientEmail: string
  problemDescription: string
  date: string
  time: string
  duration: string
  status: "upcoming" | "completed" | "cancelled" | "pending"
  type: "Video Call" | "Phone Call" | "In-Person"
  fee: string
  amount?: number
}

interface LawyerStats {
  totalBookings: number
  completedSessions: number
  totalReviews: number
  averageRating: number
  totalEarnings: string
  thisMonthBookings: number
  thisMonthEarnings: string
}

export default function LawyerDashboard() {
  const [lawyer, setLawyer] = useState<any>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [stats, setStats] = useState<LawyerStats>({
    totalBookings: 0,
    completedSessions: 0,
    totalReviews: 0,
    averageRating: 0,
    totalEarnings: "$0",
    thisMonthBookings: 0,
    thisMonthEarnings: "$0",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadLawyerData()
  }, [])

  const loadLawyerData = async () => {
    setLoading(true)
    try {
      // Get lawyer profile
      const lawyerProfile = await auth.getProfile()
      setLawyer(lawyerProfile)

      // Get lawyer consultations/bookings
      if (lawyerProfile.userId) {
        const consultationsResponse = await lawyerApi.getAllBookings(lawyerProfile.userId)
        const consultationsData = consultationsResponse.data.orders || consultationsResponse.data.bookings || []

        // Transform API data to match our interface
        const transformedConsultations = consultationsData.map((consultation: any) => ({
          _id: consultation._id || consultation.id,
          id: consultation._id || consultation.id,
          clientName: consultation.clientName || consultation.client?.name || "Unknown Client",
          clientEmail: consultation.clientEmail || consultation.client?.email || "unknown@email.com",
          problemDescription: consultation.problemDescription || consultation.description || "No description provided",
          date: consultation.date || consultation.scheduledDate || new Date().toISOString().split("T")[0],
          time: consultation.time || consultation.scheduledTime || "10:00 AM",
          duration: consultation.duration || "30 minutes",
          status: consultation.status || "pending",
          type: consultation.type || consultation.consultationType || "Video Call",
          fee: consultation.fee || `$${consultation.amount || 150}`,
          amount: consultation.amount || 150,
        }))

        setConsultations(transformedConsultations)

        // Calculate stats from consultations
        const totalBookings = transformedConsultations.length
        const completedSessions = transformedConsultations.filter((c: any) => c.status === "completed").length
        const totalEarnings = transformedConsultations.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

        setStats({
          totalBookings,
          completedSessions,
          totalReviews: Math.floor(completedSessions * 0.8), // Estimate
          averageRating: 4.8,
          totalEarnings: `$${totalEarnings.toLocaleString()}`,
          thisMonthBookings: Math.floor(totalBookings * 0.3), // Estimate
          thisMonthEarnings: `$${Math.floor(totalEarnings * 0.3).toLocaleString()}`,
        })
      }
    } catch (error: any) {
      console.error("Error loading lawyer data:", error)
      setError(error.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteConsultation = async (consultationId: string) => {
    try {
      await lawyerApi.completeConsultation(consultationId)
      setConsultations((prev) =>
        prev.map((consultation) =>
          consultation.id === consultationId ? { ...consultation, status: "completed" as const } : consultation,
        ),
      )
    } catch (error) {
      console.error("Error completing consultation:", error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video Call":
        return <Video className="h-4 w-4" />
      case "Phone Call":
        return <Phone className="h-4 w-4" />
      case "In-Person":
        return <MapPin className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const upcomingConsultations = consultations.filter((c) => c.status === "upcoming" || c.status === "pending")

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="lawyer">
        <DashboardLayout userType="lawyer" user={{ name: "Loading...", email: "" }}>
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute requiredUserType="lawyer">
        <DashboardLayout userType="lawyer" user={{ name: "Error", email: "" }}>
          <div className="text-center text-red-400 p-8">
            <p>Error: {error}</p>
            <Button onClick={loadLawyerData} className="mt-4">
              Retry
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredUserType="lawyer">
      <DashboardLayout userType="lawyer" user={lawyer}>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white">
                Welcome back, <GradientText>{lawyer?.name || "Lawyer"}</GradientText>!
              </h1>
              <p className="text-slate-400 text-lg">Manage your consultations and track your practice</p>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
            >
              <Calendar className="mr-2 h-5 w-5" />
              View Schedule
            </Button>
          </div>

          {/* Lawyer Profile Overview */}
          <FloatingCard>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <UserIcon className="h-6 w-6 text-emerald-400" />
                <GradientText variant="secondary" className="text-xl font-semibold">
                  Professional Profile
                </GradientText>
              </div>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-emerald-400/30">
                    <AvatarImage src={lawyer?.avatar || "/placeholder.svg"} alt={lawyer?.name || "Lawyer"} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      {lawyer?.name?.charAt(0) || "L"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Name</p>
                      <p className="text-white font-medium">{lawyer?.name || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Email</p>
                      <p className="text-white font-medium">{lawyer?.email || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Lawyer ID</p>
                      <p className="text-white font-medium">{lawyer?.id || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Account Type</p>
                      <p className="text-white font-medium capitalize">{lawyer?.userType || "Lawyer"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Rating</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-medium">{stats.averageRating}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Total Earnings</p>
                      <p className="text-white font-medium">{stats.totalEarnings}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FloatingCard>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">Total Bookings</p>
                    <p className="text-3xl font-bold text-white">
                      <AnimatedCounter value={stats.totalBookings} />
                    </p>
                    <div className="flex items-center gap-1 text-emerald-400 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>+{stats.thisMonthBookings} this month</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Calendar className="h-12 w-12 text-blue-400" />
                    <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-full" />
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">Completed Sessions</p>
                    <p className="text-3xl font-bold text-white">
                      <AnimatedCounter value={stats.completedSessions} />
                    </p>
                    <Progress
                      value={stats.totalBookings > 0 ? (stats.completedSessions / stats.totalBookings) * 100 : 0}
                      className="mt-2 h-2 bg-slate-700"
                    />
                  </div>
                  <div className="relative">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                    <div className="absolute inset-0 bg-green-400/20 blur-lg rounded-full" />
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">Total Reviews</p>
                    <p className="text-3xl font-bold text-white">
                      <AnimatedCounter value={stats.totalReviews} />
                    </p>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400" />
                      <span>{stats.averageRating} average</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Users className="h-12 w-12 text-purple-400" />
                    <div className="absolute inset-0 bg-purple-400/20 blur-lg rounded-full" />
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">Total Earnings</p>
                    <p className="text-3xl font-bold text-white">{stats.totalEarnings}</p>
                    <div className="flex items-center gap-1 text-emerald-400 text-sm">
                      <Zap className="h-4 w-4" />
                      <span>{stats.thisMonthEarnings} this month</span>
                    </div>
                  </div>
                  <div className="relative">
                    <DollarSign className="h-12 w-12 text-emerald-400" />
                    <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full" />
                  </div>
                </div>
              </div>
            </FloatingCard>
          </div>

          {/* Upcoming Consultations */}
          <FloatingCard>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Upcoming Consultations</h3>
                  <p className="text-slate-400">Your scheduled client consultations</p>
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1">
                  {upcomingConsultations.length} Active
                </Badge>
              </div>

              {upcomingConsultations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <Calendar className="mx-auto h-16 w-16 text-slate-600" />
                    <div className="absolute inset-0 bg-slate-600/20 blur-xl rounded-full" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No upcoming consultations</h3>
                  <p className="text-slate-400">Your scheduled consultations will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingConsultations.map((consultation) => (
                    <GlassCard key={consultation.id} variant="subtle" className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border border-white/20">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {consultation.clientName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-white text-lg">{consultation.clientName}</h4>
                              <p className="text-slate-400">{consultation.clientEmail}</p>
                            </div>
                          </div>

                          <GlassCard variant="subtle" className="p-4">
                            <p className="text-sm font-medium text-slate-300 mb-2">Problem Description:</p>
                            <p className="text-sm text-slate-400">{consultation.problemDescription}</p>
                          </GlassCard>

                          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span>{consultation.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-purple-400" />
                              <span>{consultation.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(consultation.type)}
                              <span>{consultation.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-400" />
                              <span className="font-medium">{consultation.fee}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 lg:min-w-[160px]">
                          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0">
                            {consultation.type === "Video Call" && <Video className="mr-2 h-4 w-4" />}
                            {consultation.type === "Phone Call" && <Phone className="mr-2 h-4 w-4" />}
                            {consultation.type === "In-Person" && <MapPin className="mr-2 h-4 w-4" />}
                            Start Session
                          </Button>
                          <Button
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => handleCompleteConsultation(consultation.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Complete
                          </Button>
                          <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </FloatingCard>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FloatingCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                  <GradientText variant="secondary" className="text-xl font-semibold">
                    This Month's Performance
                  </GradientText>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Bookings</span>
                    <span className="text-white font-bold text-lg">{stats.thisMonthBookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Earnings</span>
                    <span className="text-white font-bold text-lg">{stats.thisMonthEarnings}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium">Completion Rate</span>
                      <span className="text-white font-bold">
                        {stats.totalBookings > 0
                          ? Math.round((stats.completedSessions / stats.totalBookings) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={stats.totalBookings > 0 ? (stats.completedSessions / stats.totalBookings) * 100 : 0}
                      className="h-3 bg-slate-700"
                    />
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="h-6 w-6 text-yellow-400" />
                  <GradientText variant="accent" className="text-xl font-semibold">
                    Client Feedback
                  </GradientText>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-white font-bold text-lg">{stats.averageRating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Total Reviews</span>
                    <span className="text-white font-bold text-lg">{stats.totalReviews}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">5 stars</span>
                        <span className="text-slate-300">85%</span>
                      </div>
                      <Progress value={85} className="h-2 bg-slate-700" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">4 stars</span>
                        <span className="text-slate-300">12%</span>
                      </div>
                      <Progress value={12} className="h-2 bg-slate-700" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">3 stars</span>
                        <span className="text-slate-300">3%</span>
                      </div>
                      <Progress value={3} className="h-2 bg-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            </FloatingCard>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
