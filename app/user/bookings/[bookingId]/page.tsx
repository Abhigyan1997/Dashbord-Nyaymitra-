"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, Phone, Video, MessageSquare, User, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useToast } from "@/components/ui/use-toast"
import { userApi } from "@/lib/api"
import { format } from "date-fns"
import { authUtils } from "@/lib/auth"

interface BookingDetails {
    _id: string
    userId: string
    lawyerId: string
    userName: string
    lawyerName: string
    date: string
    slot: string
    mode: "video" | "phone" | "chat" | "inPerson"
    status: "pending" | "confirmed" | "completed" | "cancelled"
    amount: number
    paymentId: string
    paymentMode: string
    createdAt: string
    updatedAt: string
    meetingLink?: string
    inPersonLocation?: string
}

export default function BookingDetailsPage() {
    const { bookingId } = useParams()
    const { toast } = useToast()
    const [booking, setBooking] = useState<BookingDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState({
        id: "",
        name: "",
        email: "",
        avatar: "",
        phone: ""
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const currentUser = authUtils.getUser()
                if (currentUser) {
                    setUser({
                        id: currentUser.id,
                        name: currentUser.name,
                        email: currentUser.email,
                        avatar: currentUser.avatar || "/default-avatar.png",
                        phone: currentUser.phone || ""
                    })
                }

                const response = await userApi.getBookingById(bookingId as string)
                if (response.data.success) {
                    setBooking(response.data.booking)
                } else {
                    toast({
                        title: "Error",
                        description: response.data.message || "Failed to load booking details",
                        variant: "destructive"
                    })
                }
            } catch (error) {
                console.error("Error fetching booking details:", error)
                toast({
                    title: "Error",
                    description: "Failed to load booking details",
                    variant: "destructive"
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [bookingId, toast])

    const handleCancelBooking = async () => {
        try {
            const response = await userApi.cancelBooking(bookingId as string)
            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Booking has been cancelled"
                })
                setBooking(prev => prev ? { ...prev, status: "cancelled" } : null)
            } else {
                toast({
                    title: "Error",
                    description: response.data.message || "Failed to cancel booking",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("Error cancelling booking:", error)
            toast({
                title: "Error",
                description: "Failed to cancel booking",
                variant: "destructive"
            })
        }
    }

    const handleJoinMeeting = () => {
        if (booking?.meetingLink) {
            window.open(booking.meetingLink, "_blank")
        }
    }

    if (loading) {
        return (
            <ProtectedRoute requiredUserType="user">
                <DashboardLayout userType="user" user={user}>
                    <div className="p-4 text-center text-muted-foreground">Loading booking details...</div>
                </DashboardLayout>
            </ProtectedRoute>
        )
    }

    if (!booking) {
        return (
            <ProtectedRoute requiredUserType="user">
                <DashboardLayout userType="user" user={user}>
                    <div className="p-4 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                        <h3 className="mt-4 text-lg font-semibold">Booking not found</h3>
                        <p className="text-muted-foreground">The booking you're looking for doesn't exist or you don't have permission to view it</p>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        )
    }

    const formattedDate = format(new Date(booking.date), "PPP")
    const isUpcoming = ["pending", "confirmed"].includes(booking.status)
    const isCancelled = booking.status === "cancelled"
    const isCompleted = booking.status === "completed"

    return (
        <ProtectedRoute requiredUserType="user">
            <DashboardLayout userType="user" user={user}>
                <div className="space-y-6 p-4 md:p-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Booking Details</h1>
                        <p className="text-muted-foreground">Consultation with {booking.lawyerName}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Booking Card */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl">Consultation Details</CardTitle>
                                        <Badge
                                            variant={
                                                isCancelled ? "destructive" :
                                                    isCompleted ? "secondary" :
                                                        "default"
                                            }
                                        >
                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-16 w-16">
                                            <AvatarImage src="/default-avatar.png" />
                                            <AvatarFallback>{booking.lawyerName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="text-lg font-semibold">{booking.lawyerName}</h3>
                                            <p className="text-muted-foreground">Lawyer</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-secondary">
                                                <Calendar className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Date</p>
                                                <p className="font-medium">{formattedDate}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-secondary">
                                                <Clock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Time</p>
                                                <p className="font-medium">{booking.slot}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-secondary">
                                                {booking.mode === "video" && <Video className="h-5 w-5 text-primary" />}
                                                {booking.mode === "phone" && <Phone className="h-5 w-5 text-primary" />}
                                                {booking.mode === "chat" && <MessageSquare className="h-5 w-5 text-primary" />}
                                                {booking.mode === "inPerson" && <User className="h-5 w-5 text-primary" />}
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Consultation Mode</p>
                                                <p className="font-medium">
                                                    {booking.mode === "video" && "Video Call"}
                                                    {booking.mode === "phone" && "Phone Call"}
                                                    {booking.mode === "chat" && "Chat"}
                                                    {booking.mode === "inPerson" && "In Person"}
                                                </p>
                                                {booking.mode === "inPerson" && booking.inPersonLocation && (
                                                    <p className="text-sm text-muted-foreground mt-1">{booking.inPersonLocation}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-secondary">
                                                <CheckCircle className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Payment</p>
                                                <p className="font-medium">₹{booking.amount}</p>
                                                <Badge variant="outline" className="mt-1">
                                                    Completed
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {isUpcoming && (
                                        <div className="flex gap-3 pt-4">
                                            {booking.mode === "video" && booking.meetingLink && (
                                                <Button onClick={handleJoinMeeting}>
                                                    <Video className="mr-2 h-4 w-4" />
                                                    Join Meeting
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelBooking}
                                                disabled={!isUpcoming}
                                            >
                                                Cancel Booking
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Meeting Instructions */}
                            {isUpcoming && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl">Meeting Instructions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {booking.mode === "video" && (
                                            <>
                                                <p>Your video consultation will be conducted via Zoom. Please join using the button above.</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Join 5 minutes before your scheduled time</li>
                                                    <li>Ensure you have a stable internet connection</li>
                                                    <li>Use headphones for better audio quality</li>
                                                    <li>Have all relevant documents ready</li>
                                                </ul>
                                            </>
                                        )}
                                        {booking.mode === "phone" && (
                                            <>
                                                <p>The lawyer will call you at your registered phone number at the scheduled time.</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Keep your phone nearby and charged</li>
                                                    <li>Ensure you're in a quiet environment</li>
                                                    <li>Have all relevant documents ready</li>
                                                </ul>
                                            </>
                                        )}
                                        {booking.mode === "inPerson" && (
                                            <>
                                                <p>Your in-person consultation will be at the specified location.</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Arrive 10 minutes before your scheduled time</li>
                                                    <li>Bring all relevant documents</li>
                                                    <li>Carry a valid ID proof</li>
                                                </ul>
                                            </>
                                        )}
                                        {booking.mode === "chat" && (
                                            <>
                                                <p>Your chat consultation will be conducted via our messaging platform.</p>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    <li>Log in to your account at the scheduled time</li>
                                                    <li>Navigate to the Messages section</li>
                                                    <li>Have all relevant documents ready to share</li>
                                                </ul>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Booking Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Booking Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Consultation Fee</span>
                                        <span>₹{booking.amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Payment Method</span>
                                        <span className="capitalize">{booking.paymentMode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Payment Status</span>
                                        <Badge variant="outline" className="capitalize">
                                            Completed
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between pt-4 border-t">
                                        <span className="font-medium">Total Paid</span>
                                        <span className="font-medium">₹{booking.amount}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Support Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Need Help?</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-muted-foreground">
                                        If you have any questions about your booking, our support team is here to help.
                                    </p>
                                    <Button variant="outline" className="w-full">
                                        Contact Support
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}