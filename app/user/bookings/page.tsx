"use client"
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Phone, Video, Search, Filter, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { userApi } from "@/lib/api"
import { authUtils, auth } from "@/lib/auth"
import { jwtDecode } from "jwt-decode"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Booking {
  _id: string;
  userId: string;
  lawyerId: string;
  lawyerName: string;
  date: string;
  slot: string;
  mode: 'video' | 'call' | 'chat' | 'inPerson';
  amount: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  paymentMode: string;
  paymentId: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserBookingsPage() {
  const [page, setPage] = useState(1);
  const limit = 5; // Number of bookings per page
  const [totalPages, setTotalPages] = useState(1);

  const [user, setUser] = useState(authUtils.getUser())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await auth.getProfile();
        authUtils.setUser(currentUser);
        setUser(currentUser);

        if (currentUser.userId) {
          await loadBookings(currentUser.userId);
        } else {
          throw new Error("User ID not available");
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [page]); // <== page triggers new load


  const loadBookings = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.getAllBookings(userId, page, limit); // send page and limit
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch bookings");
      }

      setBookings(response.data.bookings || []);
      setTotalPages(response.data.totalPages || 1); // from backend
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };


  const handleCancelBooking = async (bookingId: string) => {
    try {
      await userApi.cancelBooking(bookingId)
      const token = localStorage.getItem("authToken")
      if (token) {
        const decoded: any = jwtDecode(token)
        await loadBookings(decoded.userId)
      }
    } catch (err) {
      console.error("Error cancelling booking:", err)
      setError("Failed to cancel booking. Please try again.")
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = booking.lawyerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "upcoming" && booking.status === "confirmed") ||
      (statusFilter === "completed" && booking.status === "completed") ||
      (statusFilter === "cancelled" && booking.status === "cancelled")
    return matchesSearch && matchesStatus
  })

  const upcomingBookings = filteredBookings.filter((b) => b.status === "confirmed")
  const pastBookings = filteredBookings.filter((b) => b.status === "completed")
  const cancelledBookings = filteredBookings.filter((b) => b.status === "cancelled")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "completed":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      case "cancelled":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    }
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "video":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400"
      case "call":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      case "inPerson":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      case "chat":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    }
  }

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (timeString: string) => {
    return timeString.replace(/:00$/, '') // Remove :00 if it's at the end
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const BookingCard = ({ booking }: { booking: Booking }) => {
    return (
      <Card
        className="hover:shadow-md transition-shadow duration-200 group cursor-pointer"
        onClick={() => router.push(`/user/bookings/${booking._id}`)}
      >
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                  {booking.lawyerName}
                </h4>
                <Badge className={cn(getStatusColor(booking.status), "rounded-full px-3 py-1")}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatDate(booking.date)}</span>
                </div>

                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatTime(booking.slot)}</span>
                </div>

                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full",
                  getModeColor(booking.mode)
                )}>
                  {getTypeIcon(booking.mode)}
                  <span className="font-medium">
                    {booking.mode.charAt(0).toUpperCase() + booking.mode.slice(1)}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full">
                  <span className="font-medium">{formatAmount(booking.amount)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {booking.status === "confirmed" && (
                <>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleCancelBooking(booking._id);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {booking.status === "completed" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/user/bookings/${booking._id}`);
                    }}
                  >
                    View Details
                  </Button>
                  <Button variant="default" size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700" onClick={(e) => e.stopPropagation()}>
                    Leave Review
                  </Button>
                </>
              )}
              {booking.status === "cancelled" && (
                <Button variant="default" size="sm" className="rounded-full" onClick={(e) => e.stopPropagation()}>
                  Book Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }


  if (loading) {
    return (
      <ProtectedRoute requiredUserType="user">
        <DashboardLayout userType="user" user={{ name: "Loading...", email: "" }}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </div>
              <Skeleton className="h-10 w-48" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
            </div>

            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Skeleton className="h-8 w-32 rounded-full" />
                        <Skeleton className="h-8 w-32 rounded-full" />
                        <Skeleton className="h-8 w-32 rounded-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute requiredUserType="user">
        <DashboardLayout userType="user" user={{ name: "Error", email: "" }}>
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="text-destructive text-center max-w-md">{error}</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!user) {
    return (
      <ProtectedRoute requiredUserType="user">
        <DashboardLayout userType="user" user={{ name: "Unknown User", email: "" }}>
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="text-destructive">User data not available</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredUserType="user">
      <DashboardLayout userType="user" user={user}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Consultations</h1>
              <p className="text-muted-foreground">Manage your legal bookings and appointments</p>
            </div>
            <Link href="/user/lawyers" passHref>
              <Button size="lg" className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                New Consultation
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by lawyer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-full">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="rounded-full bg-muted/50 p-1 h-auto">
              <TabsTrigger value="all" className="rounded-full px-4 py-1.5 data-[state=active]:shadow-sm">
                All ({filteredBookings.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-full px-4 py-1.5 data-[state=active]:shadow-sm">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="rounded-full px-4 py-1.5 data-[state=active]:shadow-sm">
                Past ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-full px-4 py-1.5 data-[state=active]:shadow-sm">
                Cancelled ({cancelledBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">No bookings found</h3>
                    <p className="text-muted-foreground mt-2">Book a consultation to get started</p>
                    <Button className="mt-6 rounded-full">Book Consultation</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredBookings.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>
            {totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-2 text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            )}


            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">No upcoming consultations</h3>
                    <p className="text-muted-foreground mt-2">Schedule a new consultation to get started</p>
                    <Button className="mt-6 rounded-full">Book Consultation</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastBookings.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">No past consultations</h3>
                    <p className="text-muted-foreground mt-2">Your completed consultations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledBookings.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">No cancelled consultations</h3>
                    <p className="text-muted-foreground mt-2">Your cancelled consultations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {cancelledBookings.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}