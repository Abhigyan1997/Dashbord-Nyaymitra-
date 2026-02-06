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
import { AxiosError } from "axios"
import { profile } from "console"

interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  profilePhoto?: string;
}

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
  phone: string
  userDetails: UserDetails
}

interface LawyerStats {
  totalBookings: number
  completedSessions: number
  totalReviews: number
  averageRating: number
  totalEarnings: string
  thisMonthBookings: number
  thisMonthEarnings: string
  netEarnings?: number
  platformCommission?: number
}

export default function LawyerDashboard() {
  const [lawyer, setLawyer] = useState<any>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [upcomingConsultations, setUpcomingConsultations] = useState<Consultation[]>([])
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
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
    totalEarnings: "₹0",
    thisMonthBookings: 0,
    thisMonthEarnings: "₹0",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadLawyerData()
  }, [])

  const loadLawyerData = async () => {
    setLoading(true)
    try {
      const lawyerProfile = await auth.getProfile()
      setLawyer(lawyerProfile)

      try {
        const upcomingRes = await lawyerApi.getUpcomingConsultations(lawyerProfile.userId)
        const upcomingRaw = upcomingRes.data?.consultations || []
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
          phone: c.userDetails?.phone || "",
          userDetails: {
            fullName: c.userDetails?.fullName || "Unknown User",
            email: c.userDetails?.email || "N/A",
            phone: c.userDetails?.phone || "",
            profilePhoto: c.userDetails?.profilePhoto || "",
          }
        }))
        setUpcomingConsultations(transformedUpcoming)
      } catch (upcomingError) {
        setUpcomingConsultations([])
      }

      try {
        const earningsResponse = await lawyerApi.getEarnings(lawyerProfile.userId)
        const earningsData = earningsResponse.data?.data || {
          totalEarnings: 0,
          platformCommission: 0,
          netEarnings: 0,
          thisMonthEarnings: 0
        }
        setEarnings({
          totalEarnings: earningsData.totalEarnings || 0,
          platformCommission: earningsData.platformCommission || 0,
          netEarnings: earningsData.netEarnings || 0,
          thisMonthEarnings: earningsData.thisMonthEarnings || 0,
        })
      } catch (earningsError) {
        setEarnings({
          totalEarnings: 0,
          platformCommission: 0,
          netEarnings: 0,
          thisMonthEarnings: 0
        })
      }

      try {
        const consultationsResponse = await lawyerApi.getAllBookings(lawyerProfile.userId)
        const consultationsData = consultationsResponse.data?.orders || consultationsResponse.data?.bookings || []

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
          fee: consultation.fee || `₹${consultation.amount || 0}`,
          amount: consultation.amount || 0,
          phone: consultation.userDetails?.phone || consultation.client?.phone || "",
          userDetails: {
            fullName: consultation.clientName || consultation.client?.name || "Unknown Client",
            email: consultation.clientEmail || consultation.client?.email || "unknown@email.com",
            phone: consultation.userDetails?.phone || consultation.client?.phone || ""
          }
        }))
        setConsultations(transformedConsultations)

        const totalBookings = transformedConsultations.length
        const completedSessions = transformedConsultations.filter((c: any) => c.status === "completed").length
        const totalEarnings = transformedConsultations.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)

        setStats({
          totalBookings,
          completedSessions,
          totalReviews: completedSessions > 0 ? Math.floor(completedSessions * 0.8) : 0,
          averageRating: completedSessions > 0 ? 4.8 : 0,
          totalEarnings: `₹${totalEarnings.toLocaleString()}`,
          thisMonthBookings: totalBookings > 0 ? Math.floor(totalBookings * 0.3) : 0,
          thisMonthEarnings: `₹${totalEarnings > 0 ? Math.floor(totalEarnings * 0.3).toLocaleString() : 0}`,
        })
      } catch (bookingsError) {
        setConsultations([])
        setStats({
          totalBookings: 0,
          completedSessions: 0,
          totalReviews: 0,
          averageRating: 0,
          totalEarnings: "₹0",
          thisMonthBookings: 0,
          thisMonthEarnings: "₹0",
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
      setConsultations(prev =>
        prev.map(consultation =>
          consultation.id === consultationId ? { ...consultation, status: "completed" } : consultation
        )
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

  const handleJoinConsultation = (consultation: Consultation) => {
    switch (consultation.type) {
      case "Video Call":
        // Replace with your actual video call URL
        window.open(`https://meet.jit.si/${consultation.id}`, '_blank')
        break
      case "Phone Call":
        if (consultation.userDetails?.phone) {
          window.location.href = `tel:${consultation.userDetails.phone}`
        }
        break
      case "In-Person":
        alert(`In-person meeting scheduled at ${consultation.time}. Address will be shared separately.`)
        break
      default:
        console.log('Unknown consultation type')
    }
    setIsDialogOpen(false)
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
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={
                          lawyer?.profilePhoto ||
                          lawyer?.avatar ||
                          undefined
                        }
                        alt={lawyer?.fullName || lawyer?.name}
                      />
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        {(lawyer?.fullName || lawyer?.name)?.charAt(0).toUpperCase() || "L"}
                      </AvatarFallback>
                    </Avatar>

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
                      <p className="text-white font-medium">{lawyer?.userId || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Account Type</p>
                      <p className="text-white font-medium capitalize">{lawyer?.userType || "Lawyer"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Rating</p>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-white font-medium">
                          {stats.averageRating || "Not rated"}
                        </span>
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
                    {stats.totalBookings > 0 ? (
                      <div className="flex items-center gap-1 text-emerald-400 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        <span>+{stats.thisMonthBookings} this month</span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No bookings yet</p>
                    )}
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
                    {stats.totalReviews > 0 ? (
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400" />
                        <span>{stats.averageRating} average</span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No reviews yet</p>
                    )}
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
                    {earnings.netEarnings > 0 ? (
                      <div className="flex items-center gap-1 text-emerald-400 text-sm">
                        <span className="text-lg font-bold">₹</span>
                        <span>{earnings.thisMonthEarnings.toLocaleString()} this month</span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No earnings yet</p>
                    )}
                  </div>
                  <div className="relative">
                    <div className="text-4xl text-emerald-400 font-bold">₹</div>
                    <div className="absolute inset-0 bg-emerald-400/20 blur-lg rounded-full" />
                  </div>
                </div>
              </div>
            </FloatingCard>
          </div>

          {/* Upcoming Consultations */}
          {upcomingConsultations.length > 0 ? (
            upcomingConsultations.map((consultation) => (
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
                        <span>{consultation.amount}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleJoinConsultation(consultation)
                      }}
                    >
                      {consultation.type === "Video Call" ? "Join" :
                        consultation.type === "Phone Call" ? "Call" :
                          "View"}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))
          ) : (
            <GlassCard className="p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Calendar className="h-12 w-12 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">No Upcoming Consultations</h3>
                <p className="text-slate-400 max-w-md">
                  You don't have any scheduled consultations yet. When you get bookings, they'll appear here.
                </p>
                <Button
                  className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                >
                  Learn how to get clients
                </Button>
              </div>
            </GlassCard>
          )}

          {/* Consultation Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-[95vw] w-[95vw] sm:w-full sm:max-w-md md:max-w-lg bg-slate-800 border-slate-700 rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white">
                  Consultation Details
                </DialogTitle>
              </DialogHeader>

              {selectedConsultation && (
                <div className="space-y-4 text-white">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border border-emerald-400/30">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl sm:text-2xl">
                        {selectedConsultation.clientName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg">{selectedConsultation.clientName}</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">{selectedConsultation.clientEmail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-slate-400">Date</p>
                      <p className="flex items-center gap-2 text-sm sm:text-base font-medium">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        {selectedConsultation.date}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-slate-400">Time</p>
                      <p className="flex items-center gap-2 text-sm sm:text-base font-medium">
                        <Clock className="h-4 w-4 text-purple-400" />
                        {selectedConsultation.time}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-slate-400">Duration</p>
                      <p className="flex items-center gap-2 text-sm sm:text-base font-medium">
                        <Clock className="h-4 w-4 text-amber-400" />
                        {selectedConsultation.duration}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-slate-400">Type</p>
                      <p className="flex items-center gap-2 text-sm sm:text-base font-medium">
                        {getTypeIcon(selectedConsultation.type)}
                        {selectedConsultation.type}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-slate-400">Fee</p>
                      <p className="flex items-center gap-2 text-sm sm:text-base font-medium">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                        {selectedConsultation.amount}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-slate-400">Status</p>
                      <Badge
                        variant={selectedConsultation.status === "completed" ? "default" : "secondary"}
                        className={
                          selectedConsultation.status === "completed"
                            ? "bg-green-600 text-white text-xs sm:text-sm"
                            : "bg-yellow-500 text-black text-xs sm:text-sm"
                        }
                      >
                        {selectedConsultation.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs sm:text-sm font-medium text-slate-400">Client Contact</p>
                    <div className="bg-slate-700/50 rounded-lg p-3 sm:p-4">
                      {selectedConsultation.userDetails?.phone ? (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-blue-400" />
                          <a
                            href={`tel:${selectedConsultation.userDetails.phone}`}
                            className="text-white text-sm sm:text-base hover:text-blue-400 transition-colors"
                          >
                            {selectedConsultation.userDetails.phone}
                          </a>
                        </div>
                      ) : (
                        <p className="text-white text-sm sm:text-base">No phone number provided</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                    <Button
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex-1"
                      onClick={() => handleJoinConsultation(selectedConsultation)}
                    >
                      {selectedConsultation.type === "Video Call" ? "Join Video Call" :
                        selectedConsultation.type === "Phone Call" ? "Call Client" :
                          "View Meeting Details"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-600 hover:bg-slate-700 text-[#0A0A0A]"
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