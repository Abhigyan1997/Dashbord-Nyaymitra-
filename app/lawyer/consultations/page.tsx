"use client"

import { useState, useEffect } from "react"
import { Calendar, Star, Clock, MapPin, Phone, Video, Search, Filter, CheckCircle, FileText, User, DollarSign, AlertCircle, ChevronLeft, ChevronRight, X, Clipboard, Mail, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { authUtils } from "@/lib/auth"
import { lawyerApi } from "@/lib/api"
import { AxiosResponse } from "axios"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface Review {
  _id: string;
  userId: string;
  lawyerId: string;
  consultationId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

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
  userEmail: string;
  userPhone?: string;
  lawyerName: string;
  documents: string[];
  paymentId: string;
  createdAt: string;
  updatedAt: string;
  userAvatar?: string;
  caseDetails?: string;
  additionalNotes?: string;
  review?: Review;
}

interface ApiResponse {
  success: boolean;
  bookings: Booking[];
  booking?: Booking;
  message?: string;
  total?: number;
}

interface LawyerUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
}

const ITEMS_PER_PAGE = 5;

export default function LawyerConsultationsPage() {
  const [lawyer, setLawyer] = useState<LawyerUser | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    const currentUser = authUtils.getUser()
    if (currentUser) {
      setLawyer(currentUser)
      loadBookings(currentUser.userId)
    }
  }, [])

  const fetchReviews = async (lawyerId: string) => {
    try {
      const response = await lawyerApi.getLawyerReviews(lawyerId);
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  };

  const loadBookings = async (lawyerUserId: string) => {
    setLoading(true);
    try {
      // Fetch both bookings and reviews in parallel
      const [bookingsResponse, reviewsResponse] = await Promise.all([
        lawyerApi.getAllBookings(lawyerUserId),
        lawyerApi.getLawyerReviews(lawyerUserId)
      ]);

      if (bookingsResponse.data.success) {
        const bookingsWithAvatarsAndReviews = bookingsResponse.data.bookings.map((booking: Booking) => {
          // Find the review for this booking (if exists)
          const review = reviewsResponse.data?.find((r: Review) => r.consultationId === booking._id);

          return {
            ...booking,
            userAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${booking.userName.replace(/\s+/g, '')}`,
            review: review || undefined
          };
        });

        setBookings(bookingsWithAvatarsAndReviews);
        setTotalPages(Math.ceil(bookingsWithAvatarsAndReviews.length / ITEMS_PER_PAGE));
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Handle 404 by setting empty bookings
        setBookings([]);
        setTotalPages(1);
      } else {
        console.error("Error loading bookings:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load consultations. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleViewDetails = async (bookingId: string) => {
    setLoadingDetails(true)
    try {
      const response = await lawyerApi.getBookingById(bookingId)
      if (response.data.success && response.data.booking) {
        setSelectedBooking(response.data.booking)
        setIsDialogOpen(true)
      }
    } catch (error) {
      console.error("Error loading booking details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load booking details.",
      })
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCompleteConsultation = async (bookingId: string) => {
    setCompletingId(bookingId)
    try {
      const response = await lawyerApi.completeConsultation(bookingId)
      if (response.data.success) {
        setBookings(prev =>
          prev.map(booking =>
            booking._id === bookingId ? { ...booking, status: "completed" } : booking
          )
        )
        toast({
          title: "Success",
          description: "Consultation marked as completed.",
        })
      }
    } catch (error) {
      console.error("Error completing consultation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark consultation as completed.",
      })
    } finally {
      setCompletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const formatTime = (slot: string) => {
    return slot.split('-').join(' to ')
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "video": return "bg-purple-100 text-purple-800"
      case "call": return "bg-blue-100 text-blue-800"
      case "chat": return "bg-green-100 text-green-800"
      case "inPerson": return "bg-orange-100 text-orange-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking._id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "upcoming" && booking.status === "confirmed") ||
      (statusFilter === "completed" && booking.status === "completed")
    return matchesSearch && matchesStatus
  })

  const upcomingBookings = filteredBookings.filter(b => b.status === "confirmed")
  const completedBookings = filteredBookings.filter(b => b.status === "completed")
  const cancelledBookings = filteredBookings.filter(b => b.status === "cancelled")

  // Pagination logic
  const getPaginatedBookings = (bookings: Booking[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return bookings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Clock className="h-3 w-3 mr-1" /> Upcoming
        </Badge>
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" /> Completed
        </Badge>
      case "cancelled":
        return <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" /> Cancelled
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const ConsultationCard = ({ booking }: { booking: Booking }) => {
    const renderReviewSection = () => {
      if (!booking.review) return null;

      return (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < (booking.review?.rating ?? 0)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
                  }`}
              />
            ))}
            <span className="ml-1 text-sm font-medium">
              {booking.review?.rating}/5
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-700">
            {booking.review?.comment}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Reviewed on {booking.review?.createdAt && formatDate(booking.review.createdAt)}
          </p>
        </div>
      );
    };

    const renderActionButtons = () => {
      switch (booking.status) {
        case "confirmed":
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCompleteConsultation(booking._id)}
              disabled={completingId === booking._id}
              className="w-full"
            >
              {completingId === booking._id ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Complete
                </>
              )}
            </Button>
          );
        case "completed":
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Completed on {formatDate(booking.updatedAt)}</span>
              </div>
              {booking.documents.length > 0 && (
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents ({booking.documents.length})
                </Button>
              )}
              <Button variant="ghost" size="sm" className="w-full">
                Send Invoice
              </Button>
            </div>
          );
        case "cancelled":
          return (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Cancelled</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => handleViewDetails(booking._id)}
                disabled={loadingDetails}
              >
                {loadingDetails ? "Loading..." : "View Details"}
              </Button>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <Card className="hover:shadow-md transition-shadow border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={booking.userAvatar} />
                  <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{booking.userName}</h4>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">Booking ID: {booking._id}</p>

                  {booking.caseDetails && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            <FileText className="inline h-3 w-3 mr-1" />
                            {booking.caseDetails}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{booking.caseDetails}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {renderReviewSection()}
              <Separator className="my-3" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date
                  </p>
                  <p className="font-medium">{formatDate(booking.date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Time
                  </p>
                  <p className="font-medium">{formatTime(booking.slot)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Fee
                  </p>
                  <p className="font-medium">₹{booking.amount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    {getTypeIcon(booking.mode)}
                    Mode
                  </p>
                  <Badge className={`${getModeColor(booking.mode)} hover:${getModeColor(booking.mode)}`}>
                    {getModeLabel(booking.mode)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:min-w-[180px]">
              {renderActionButtons()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "call":
        return <Phone className="h-4 w-4" />
      case "inPerson":
        return <MapPin className="h-4 w-4" />
      case "chat":
        return <FileText className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const StatsCard = ({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) => (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  )

  const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const maxVisiblePages = 5

    const getPageNumbers = () => {
      const pages = []
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = startPage + maxVisiblePages - 1

      if (endPage > totalPages) {
        endPage = totalPages
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      return pages
    }

    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
          <span className="font-medium">{totalItems}</span> consultations
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageNumbers().map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const BookingDetailsDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Booking Details</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDialogOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Detailed information about the consultation
          </DialogDescription>
        </DialogHeader>

        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border">
                <AvatarImage src={selectedBooking.userAvatar} />
                <AvatarFallback>{selectedBooking.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{selectedBooking.userName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(selectedBooking.status)}
                  <Badge className={`${getModeColor(selectedBooking.mode)} hover:${getModeColor(selectedBooking.mode)}`}>
                    {getModeLabel(selectedBooking.mode)}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Booking Information</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Booking ID:</span>
                      <span className="font-medium">{selectedBooking._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Date:</span>
                      <span className="font-medium">{formatDate(selectedBooking.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Time Slot:</span>
                      <span className="font-medium">{formatTime(selectedBooking.slot)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Consultation Fee:</span>
                      <span className="font-medium">₹{selectedBooking.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Payment Status:</span>
                      <Badge variant="outline">Paid</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Client Information</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Name:</span>
                      <span className="font-medium">{selectedBooking.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Email:</span>
                      <span className="font-medium">{selectedBooking.userEmail}</span>
                    </div>
                    {selectedBooking.userPhone && (
                      <div className="flex justify-between">
                        <span className="text-sm">Phone:</span>
                        <span className="font-medium">{selectedBooking.userPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Case Details</h4>
                  {selectedBooking.caseDetails ? (
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm">{selectedBooking.caseDetails}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No case details provided</p>
                  )}
                </div>

                {selectedBooking.additionalNotes && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Additional Notes</h4>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm">{selectedBooking.additionalNotes}</p>
                    </div>
                  </div>
                )}

                {selectedBooking.documents.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Attached Documents</h4>
                    <div className="mt-2 space-y-2">
                      {selectedBooking.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Document_{index + 1}.pdf</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button variant="outline">
                <Clipboard className="mr-2 h-4 w-4" />
                Copy Details
              </Button>
              <Button>
                <Mail className="mr-2 h-4 w-4" />
                Contact Client
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  if (loading && !bookings.length) {
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
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-4 w-[200px] mt-2" />
              </div>
              <Skeleton className="h-10 w-[180px]" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[120px]" />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[180px]" />
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[200px]" />
              ))}
            </div>
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
              <p className="text-muted-foreground">Manage your client appointments and consultations</p>
            </div>
            {/* <Button size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button> */}
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Consultations"
              value={bookings.length.toString()}
              icon={<User className="h-4 w-4 text-muted-foreground" />}
              trend="+12% from last month"
            />
            <StatsCard
              title="Upcoming"
              value={upcomingBookings.length.toString()}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Completed"
              value={completedBookings.length.toString()}
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
              trend="+8% from last month"
            />
            <StatsCard
              title="Total Earnings"
              value={`₹${bookings.reduce((sum, b) => sum + b.amount, 0)}`}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by client name, booking ID..."
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
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <span>All</span>
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {filteredBookings.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <span>Upcoming</span>
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {upcomingBookings.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <span>Completed</span>
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {completedBookings.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <span>Cancelled</span>
                <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                  {cancelledBookings.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No consultations found</h3>
                    <p className="text-muted-foreground">Your upcoming consultations will appear here</p>
                    {/* <Button className="mt-4">Schedule Availability</Button> */}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {getPaginatedBookings(filteredBookings).map((booking) => (
                    <ConsultationCard key={booking._id} booking={booking} />
                  ))}
                  <Pagination
                    totalItems={filteredBookings.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No upcoming consultations</h3>
                    <p className="text-muted-foreground">Your scheduled consultations will appear here</p>
                    <Button className="mt-4">Schedule Availability</Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {getPaginatedBookings(upcomingBookings).map((booking) => (
                    <ConsultationCard key={booking._id} booking={booking} />
                  ))}
                  <Pagination
                    totalItems={upcomingBookings.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedBookings.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No completed consultations</h3>
                    <p className="text-muted-foreground">Your completed consultations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {getPaginatedBookings(completedBookings).map((booking) => (
                    <ConsultationCard key={booking._id} booking={booking} />
                  ))}
                  <Pagination
                    totalItems={completedBookings.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledBookings.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="text-center py-12">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No cancelled consultations</h3>
                    <p className="text-muted-foreground">Your cancelled consultations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {getPaginatedBookings(cancelledBookings).map((booking) => (
                    <ConsultationCard key={booking._id} booking={booking} />
                  ))}
                  <Pagination
                    totalItems={cancelledBookings.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>

          <BookingDetailsDialog />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}