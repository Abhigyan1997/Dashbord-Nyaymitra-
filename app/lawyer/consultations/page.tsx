"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Phone, Video, Search, Filter, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { authUtils } from "@/lib/auth"
import { lawyerApi } from "@/lib/api"
import { AxiosResponse } from "axios"

interface Booking {
  _id: string;
  userId: string;
  lawyerId: string;
  date: string;
  slot: string;
  mode: "video" | "call" | "chat" | "inPerson";
  amount: number;
  status: "confirmed" | "completed" | "cancelled";
  payoutStatus: string;
  userName: string;
  lawyerName: string;
  documents: string[];
  paymentId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  bookings: Booking[];
}

interface LawyerUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function LawyerConsultationsPage() {
  const [lawyer, setLawyer] = useState<LawyerUser | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentUser = authUtils.getUser()
    if (currentUser) {
      setLawyer(currentUser)
      loadBookings(currentUser.userId)
    }
  }, [])

  const loadBookings = async (lawyerUserId: string) => {
    setLoading(true)
    try {
      const response: AxiosResponse<ApiResponse> = await lawyerApi.getAllBookings(lawyerUserId)
      if (response.data.success) {
        setBookings(response.data.bookings)
      }
    } catch (error) {
      console.error("Error loading bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteConsultation = async (bookingId: string) => {
    try {
      setBookings(prev =>
        prev.map(booking =>
          booking._id === bookingId ? { ...booking, status: "completed" } : booking
        )
      )
    } catch (error) {
      console.error("Error completing consultation:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTime = (slot: string) => {
    return slot.split('-').join(' to ')
  }

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "video": return "Video Call"
      case "call": return "Phone Call"
      case "chat": return "Chat"
      case "inPerson": return "In-Person"
      default: return mode
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = booking.userName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "upcoming" && booking.status === "confirmed") ||
      (statusFilter === "completed" && booking.status === "completed")
    return matchesSearch && matchesStatus
  })

  const upcomingBookings = filteredBookings.filter(b => b.status === "confirmed")
  const completedBookings = filteredBookings.filter(b => b.status === "completed")
  const cancelledBookings = filteredBookings.filter(b => b.status === "cancelled")

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "call":
        return <Phone className="h-4 w-4" />
      case "inPerson":
        return <MapPin className="h-4 w-4" />
      case "chat":
        return <Calendar className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const ConsultationCard = ({ booking }: { booking: Booking }) => (
    <Card key={booking._id}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-lg">{booking.userName}</h4>
                <p className="text-sm text-muted-foreground">Booking ID: {booking._id}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(booking.date)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(booking.slot)}
              </div>
              <div className="flex items-center gap-1">
                {getTypeIcon(booking.mode)}
                {getModeLabel(booking.mode)}
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">₹{booking.amount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={booking.status === "completed" ? "default" : booking.status === "cancelled" ? "destructive" : "outline"}>
                  {booking.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:min-w-[160px]">
            {booking.status === "confirmed" && (
              <>
                <Button size="sm">
                  {booking.mode === "video" && <Video className="mr-2 h-4 w-4" />}
                  {booking.mode === "call" && <Phone className="mr-2 h-4 w-4" />}
                  {booking.mode === "inPerson" && <MapPin className="mr-2 h-4 w-4" />}
                  Start Session
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompleteConsultation(booking._id)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
                <Button variant="ghost" size="sm">
                  Reschedule
                </Button>
              </>
            )}
            {booking.status === "completed" && (
              <>
                <Badge className="bg-green-100 text-green-800 justify-center">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
                <Button variant="outline" size="sm">
                  View Documents ({booking.documents.length})
                </Button>
                <Button variant="ghost" size="sm">
                  Send Invoice
                </Button>
              </>
            )}
            {booking.status === "cancelled" && (
              <Badge variant="destructive" className="justify-center">
                Cancelled
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading && !bookings.length) {
    return (
      <ProtectedRoute requiredUserType="lawyer">
        <DashboardLayout userType="lawyer" user={lawyer ? {
          name: lawyer.name,
          email: lawyer.email,
          avatar: lawyer.avatar
        } : undefined}>
          <div className="flex justify-center items-center h-64">
            <p>Loading consultations...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredUserType="lawyer">
      <DashboardLayout userType="lawyer" user={lawyer ? {
        name: lawyer.name,
        email: lawyer.email,
        avatar: lawyer.avatar
      } : undefined}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
              <p className="text-muted-foreground">Manage your client consultations</p>
            </div>
            <Button size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Consultations</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Consultations Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All ({filteredBookings.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedBookings.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({cancelledBookings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No consultations found</h3>
                    <p className="text-muted-foreground">Your consultations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
                  <ConsultationCard key={booking._id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No upcoming consultations</h3>
                    <p className="text-muted-foreground">Your scheduled consultations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingBookings.map((booking) => (
                  <ConsultationCard key={booking._id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedBookings.map((booking) => (
                <ConsultationCard key={booking._id} booking={booking} />
              ))}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No cancelled consultations</h3>
                  </CardContent>
                </Card>
              ) : (
                cancelledBookings.map((booking) => (
                  <ConsultationCard key={booking._id} booking={booking} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}