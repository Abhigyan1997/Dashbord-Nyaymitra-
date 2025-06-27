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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

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
  thisMonthEarnings: string,
  netEarnings?: number;
  platformCommission?: number;
}

export default function LawyerDashboard() {
  const [lawyer, setLawyer] = useState<any>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [upcomingConsultations, setUpcomingConsultations] = useState<any[]>([])
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    platformCommission: 0,
    netEarnings: 0,
    thisMonthEarnings: 0
  })

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

      const upcomingRes = await lawyerApi.getUpcomingConsultations(lawyerProfile.userId);
      const upcomingRaw = upcomingRes.data?.consultations || [];
      const transformedUpcoming = upcomingRaw.map((c: any) => ({
        id: c._id,
        clientName: c.userDetails?.fullName || "Unknown User",
        clientEmail: c.userDetails?.email || "N/A",
        problemDescription: c.description || "No description provided",
        date: new Date(c.date).toLocaleDateString(),
        time: c.slot,
        duration: c.duration || "30 minutes",
        status: c.status || "pending",
        type: c.mode === "inPerson" ? "In-Person" : c.mode === "video" ? "Video Call" : "Phone Call",
        fee: `₹${c.amount}`,
        amount: c.amount,
      }))

      setUpcomingConsultations(transformedUpcoming)

      // Get earnings after lawyerProfile is available
      const earningsResponse = await lawyerApi.getEarnings(lawyerProfile.userId);
      const earningsData = earningsResponse.data?.data || {}

      setEarnings({
        totalEarnings: earningsData.totalEarnings || 0,
        platformCommission: earningsData.platformCommission || 0,
        netEarnings: earningsData.netEarnings || 0,
        thisMonthEarnings: earningsData.thisMonthEarnings || 0,
      });

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
        return <Video className="h-4 w-4 text-blue-400" />
      case "Phone Call":
        return <Phone className="h-4 w-4 text-green-400" />
      case "In-Person":
        return <MapPin className="h-4 w-4 text-orange-400" />
      default:
        return <Calendar className="h-4 w-4 text-purple-400" />
    }
  }

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
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      {lawyer?.name?.charAt(0).toUpperCase() || "L"}
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
                      <p className="text-sm font-medium text-slate-400">Net Earnings</p>
                      <p className="text-white font-medium">₹{earnings.netEarnings.toLocaleString()}</p>
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
                    <p className="text-sm font-medium text-slate-400">Net Earnings</p>
                    <p className="text-3xl font-bold text-white">₹{earnings.netEarnings.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-emerald-400 text-sm">
                      <span className="text-lg font-bold">₹</span>
                      <span>{earnings.thisMonthEarnings.toLocaleString()} this month</span>
                    </div>
                  </div>
                  <div className="relative">
                    {/* Replace DollarSign icon with a text ₹ or rupee icon */}
                    <div className="text-4xl text-emerald-400 font-bold">₹</div>
                    <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full" />
                  </div>
                </div>
              </div>
            </FloatingCard>

          </div>

          {/* Upcoming Consultations */}
          {upcomingConsultations.map((consultation) => (
            <GlassCard
              key={consultation.id}
              variant="subtle"
              className="p-6 cursor-pointer hover:bg-white/5 transition"
              onClick={() => {
                setSelectedConsultation(consultation)
                setIsDialogOpen(true)
              }}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <h4 className="text-white text-lg font-semibold">
                    {consultation.type} Consultation with {consultation.clientName}
                  </h4>
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
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span>{consultation.fee}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    Join
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}

          {/* Consultation Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md md:max-w-lg bg-slate-800 border-slate-700 rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">
                  Consultation Details
                </DialogTitle>
              </DialogHeader>

              {selectedConsultation && (
                <div className="space-y-6 text-white">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-emerald-400/30">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                        {selectedConsultation.clientName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedConsultation.clientName}</h3>
                      <p className="text-slate-400 text-sm">{selectedConsultation.clientEmail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Date</p>
                      <p className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        {selectedConsultation.date}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Time</p>
                      <p className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 text-purple-400" />
                        {selectedConsultation.time}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Duration</p>
                      <p className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 text-amber-400" />
                        {selectedConsultation.duration}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Type</p>
                      <p className="flex items-center gap-2 font-medium">
                        {getTypeIcon(selectedConsultation.type)}
                        {selectedConsultation.type}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Fee</p>
                      <p className="flex items-center gap-2 font-medium">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        {selectedConsultation.fee}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">Status</p>
                      <Badge
                        variant={selectedConsultation.status === "completed" ? "default" : "secondary"}
                        className={
                          selectedConsultation.status === "completed"
                            ? "bg-green-600 text-white"
                            : "bg-yellow-500 text-black"
                        }
                      >
                        {selectedConsultation.status}
                      </Badge>

                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-slate-400">Problem Description</p>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-white">
                        {selectedConsultation.problemDescription || "No description provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-1"
                      onClick={() => {
                        // Handle join consultation
                        setIsDialogOpen(false)
                      }}
                    >
                      Join Consultation
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-600 hover:bg-slate-700"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}