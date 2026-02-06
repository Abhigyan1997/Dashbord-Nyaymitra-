"use client"

import { useState, useEffect } from "react"
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Video,
  UserIcon,
  CreditCard,
  TrendingUp,
  Star,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { GlassCard } from "@/components/ui/glass-card"
import { FloatingCard } from "@/components/ui/floating-card"
import { GradientText } from "@/components/ui/gradient-text"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { userApi } from "@/lib/api"
import { auth } from "@/lib/auth"

interface Booking {
  _id: string
  id: string
  lawyerName: string
  lawyerSpecialty: string
  date: string
  time: string
  status: "upcoming" | "completed" | "cancelled" | "pending"
  type: "Video Call" | "Phone Call" | "In-Person"
  duration: string
  fee: string
  amount?: number
  description?: string
}

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoading(true)
    try {
      const userProfile = await auth.getProfile()
      setUser(userProfile)

      if (userProfile.userId) {
        let allBookings: Booking[] = []

        // Try to get upcoming consultations
        try {
          const upcomingResponse = await userApi.getUpcomingConsultations(userProfile.userId)
          const upcomingConsultations = upcomingResponse.data?.consultations || []

          const transformedUpcoming = upcomingConsultations.map((consultation: any) => ({
            _id: consultation._id,
            id: consultation._id,
            lawyerName: consultation.lawyerDetails?.fullName || "Unknown Lawyer",
            lawyerSpecialty: consultation.lawyerDetails?.specialization || "General Law",
            date: new Date(consultation.date).toISOString().split('T')[0],
            time: consultation.slot || "10:00 AM",
            status: consultation.status === "confirmed" ? "upcoming" : "pending",
            type: consultation.mode === "chat" ? "Video Call" :
              consultation.mode === "call" ? "Phone Call" : "In-Person",
            duration: "60 minutes",
            fee: `$${consultation.amount || 0}`,
            amount: consultation.amount || 0,
            description: "Legal consultation",
          }))

          allBookings = [...allBookings, ...transformedUpcoming]
        } catch (upcomingError) {
          console.log("No upcoming consultations found or error fetching them")
        }

        // Try to get all bookings
        try {
          const bookingsResponse = await userApi.getAllBookings(userProfile.userId, 1, 100)
          const otherBookingsData = bookingsResponse.data?.orders || bookingsResponse.data?.bookings || []

          const transformedOtherBookings = otherBookingsData.map((booking: any) => ({
            _id: booking._id || booking.id,
            id: booking._id || booking.id,
            lawyerName: booking.lawyerName || booking.lawyer?.name || "Unknown Lawyer",
            lawyerSpecialty: booking.lawyerSpecialty || booking.lawyer?.specialty || "General Law",
            date: booking.date || booking.scheduledDate || new Date().toISOString().split('T')[0],
            time: booking.time || booking.scheduledTime || "10:00 AM",
            status: booking.status || "pending",
            type: booking.type || booking.consultationType || "Video Call",
            duration: booking.duration || "30 minutes",
            fee: booking.fee || `$${booking.amount || 150}`,
            amount: booking.amount || 150,
            description: booking.description || booking.problemDescription,
          }))

          allBookings = [...allBookings, ...transformedOtherBookings]
        } catch (bookingsError) {
          console.log("No other bookings found or error fetching them")
        }

        setBookings(allBookings)
      } else {
        throw new Error("User ID not found in profile")
      }
    } catch (error: any) {
      console.error("Error loading user data:", error)
      setError(error.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // ... rest of your component code remains the same ...

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await userApi.cancelBooking(bookingId)
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "cancelled" as const }
            : booking,
        ),
      )
    } catch (error) {
      console.error("Error cancelling booking:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
      case "pending":
        return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30"
      case "completed":
        return "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30"
      case "cancelled":
        return "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border-gray-500/30"
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

  const upcomingBookings = bookings.filter(
    (b) => b.status === "upcoming" || b.status === "pending",
  )
  const pastBookings = bookings.filter((b) => b.status === "completed")

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="user">
        <DashboardLayout userType="user" user={{ name: "Loading...", email: "" }}>
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute requiredUserType="user">
        <DashboardLayout userType="user" user={{ name: "Error", email: "" }}>
          <div className="text-center text-red-400 p-8">
            <p>Error: {error}</p>
            <Button onClick={loadUserData} className="mt-4">
              Retry
            </Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }
  return (
    <ProtectedRoute requiredUserType="user">
      <DashboardLayout userType="user" user={user}>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white">
                Welcome back, <GradientText>{user?.name || "User"}</GradientText>!
              </h1>
              <p className="text-slate-400 text-lg">Manage your legal consultations and bookings</p>
            </div>
            <Link href="/user/lawyers" passHref>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book New Consultation
              </Button>
            </Link>
          </div>

          {/* Profile Overview */}
          <FloatingCard>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <UserIcon className="h-6 w-6 text-blue-400" />
                <GradientText className="text-xl font-semibold">Profile Overview</GradientText>
              </div>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-blue-400/30">
                    <AvatarImage
                      src={user?.profileImage || user?.profilePhoto || user?.avatar || undefined}
                      alt={user?.name || "User"}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Name</p>
                      <p className="text-white font-medium">{user?.name || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Email</p>
                      <p className="text-white font-medium">{user?.email || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">User ID</p>
                      <p className="text-white font-medium">{user?.id || "N/A"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-400">Account Type</p>
                      <p className="text-white font-medium capitalize">{user?.userType || "Client"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FloatingCard>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FloatingCard>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">Total Bookings</p>
                    <p className="text-3xl font-bold text-white">
                      <AnimatedCounter value={bookings.length} />
                    </p>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>+12% this month</span>
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
                    <p className="text-sm font-medium text-slate-400">Upcoming</p>
                    <p className="text-3xl font-bold text-white">
                      <AnimatedCounter value={upcomingBookings.length} />
                    </p>
                    <div className="flex items-center gap-1 text-blue-400 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Next in 2 days</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Clock className="h-12 w-12 text-purple-400" />
                    <div className="absolute inset-0 bg-purple-400/20 blur-lg rounded-full" />
                  </div>
                </div>
              </div>
            </FloatingCard>

            <FloatingCard>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">Completed</p>
                    <p className="text-3xl font-bold text-white">
                      <AnimatedCounter value={pastBookings.length} />
                    </p>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <Award className="h-4 w-4" />
                      <span>100% success rate</span>
                    </div>
                  </div>
                  <div className="relative">
                    <CreditCard className="h-12 w-12 text-green-400" />
                    <div className="absolute inset-0 bg-green-400/20 blur-lg rounded-full" />
                  </div>
                </div>
              </div>
            </FloatingCard>
          </div>

          {/* Upcoming Bookings */}
          <FloatingCard>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Upcoming Consultations</h3>
                  <p className="text-slate-400">Your scheduled legal consultations</p>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
                  {upcomingBookings.length} Active
                </Badge>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <Calendar className="mx-auto h-16 w-16 text-slate-600" />
                    <div className="absolute inset-0 bg-slate-600/20 blur-xl rounded-full" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No upcoming consultations</h3>
                  <p className="text-slate-400 mb-6">Book a consultation to get started</p>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                    Book Consultation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <GlassCard key={booking.id} variant="subtle" className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-white text-lg">{booking.lawyerName}</h4>
                            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30">
                              {booking.lawyerSpecialty}
                            </Badge>
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span>{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-purple-400" />
                              <span>{booking.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(booking.type)}
                              <span>{booking.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-green-400" />
                              <span className="font-medium">{booking.fee}</span>
                            </div>
                          </div>
                          {booking.description && (
                            <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg">
                              {booking.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300"
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </FloatingCard>

          {/* Past Bookings */}
          <FloatingCard>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Recent Consultations</h3>
                  <p className="text-slate-400">Your consultation history</p>
                </div>
                <Button
                  variant="outline"
                  className="border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200"
                >
                  View All History
                </Button>
              </div>

              {pastBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <Clock className="mx-auto h-16 w-16 text-slate-600" />
                    <div className="absolute inset-0 bg-slate-600/20 blur-xl rounded-full" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No past consultations</h3>
                  <p className="text-slate-400">Your completed consultations will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastBookings.slice(0, 3).map((booking) => (
                    <GlassCard key={booking.id} variant="subtle" className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-white text-lg">{booking.lawyerName}</h4>
                            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30">
                              {booking.lawyerSpecialty}
                            </Badge>
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span>{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-purple-400" />
                              <span>{booking.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-green-400" />
                              <span className="font-medium">{booking.fee}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-black text-gray-300 hover:bg-gray-900/80 hover:text-white hover:border-gray-600 transition-all"
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          </FloatingCard>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
