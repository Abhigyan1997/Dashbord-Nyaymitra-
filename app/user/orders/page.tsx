"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, Download, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, ChevronDown, RefreshCw, Eye, Star, X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"
import { authUtils } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"

interface Order {
    _id: string
    userId: string
    userEmail: string
    serviceType: string
    serviceName: string
    documentType: string
    price: number
    currency: string
    discountApplied: number
    finalAmount: number
    status: "pending" | "processing" | "completed" | "cancelled"
    documentVersion: string
    downloadCount: number
    deliveryMethod: string
    deliveryStatus: string
    razorpayOrderId: string
    requiresRegistration: boolean
    registrationFee: number
    notaryStatus: string
    statusHistory: Array<{
        status: string
        changedAt: string
        reason: string
        _id: string
    }>
    createdAt: string
    expiresAt: string
    updatedAt: string
    completedAt?: string
    paymentAt?: string
    razorpayPaymentId?: string
    razorpaySignature?: string
}

interface Review {
    _id: string
    userId: string
    orderId: string
    rating: number
    comment: string
    serviceType: string
    serviceName: string
    createdAt: string
    updatedAt: string
}

interface ReviewData {
    rating: number
    comment: string
    orderId: string
}

interface LayoutUser {
    name: string
    email: string
    avatar?: string
}

function OrdersContent() {
    const [orders, setOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [user, setUser] = useState<LayoutUser | null>(null)
    const [hasMounted, setHasMounted] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isReviewOpen, setIsReviewOpen] = useState(false)
    const [reviewData, setReviewData] = useState<ReviewData>({
        rating: 0,
        comment: "",
        orderId: ""
    })
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [userReviews, setUserReviews] = useState<Review[]>([])

    // Check if device is mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        checkIfMobile()
        window.addEventListener('resize', checkIfMobile)
        return () => window.removeEventListener('resize', checkIfMobile)
    }, [])

    // Fix hydration issue by only running on client
    useEffect(() => {
        setHasMounted(true)
        const currentUser = authUtils.getUser()
        if (currentUser) {
            setUser({
                name: currentUser.name || currentUser.fullName || "User",
                email: currentUser.email || "",
                avatar: currentUser.avatar
            })

            fetchOrders(currentUser.userId || currentUser.id)
            fetchUserReviews(currentUser.userId || currentUser.id)
        } else {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        let result = orders

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(order =>
                order.serviceName.toLowerCase().includes(query) ||
                order.documentType.toLowerCase().includes(query) ||
                order.razorpayOrderId.toLowerCase().includes(query)
            )
        }

        if (statusFilter !== "all") {
            result = result.filter(order => order.status === statusFilter)
        }

        setFilteredOrders(result)
    }, [searchQuery, statusFilter, orders])

    const fetchOrders = async (userId: string) => {
        try {
            setIsLoading(true)
            const response = await fetch(`https://nyaymitra-backend-document-production.up.railway.app/api/documents/user/${userId}`)

            if (!response.ok) {
                throw new Error(`Failed to fetch orders: ${response.status}`)
            }

            const data = await response.json()
            setOrders(data)
        } catch (error) {
            console.error("Failed to fetch orders:", error)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    const fetchUserReviews = async (userId: string) => {
        try {
            const response = await fetch(`https://nyaymitra-backend-document-production.up.railway.app/api/reviews?userId=${userId}`)
            if (response.ok) {
                const reviews = await response.json()
                setUserReviews(reviews)
            }
        } catch (error) {
            console.error('Failed to fetch user reviews:', error)
        }
    }

    const refreshUserReviews = async () => {
        if (!user) return;

        try {
            const currentUser = authUtils.getUser();
            const userId = currentUser?.userId || currentUser?.id;

            if (!userId) return;

            const response = await fetch(`https://nyaymitra-backend-document-production.up.railway.app/api/reviews?userId=${userId}`);
            if (response.ok) {
                const reviews = await response.json();
                setUserReviews(reviews);
            }
        } catch (error) {
            console.error('Failed to refresh user reviews:', error);
        }
    };

    const hasUserReviewedOrder = (orderId: string) => {
        return userReviews.some(review => review.orderId === orderId);
    };

    const handleRefresh = () => {
        if (user) {
            setIsRefreshing(true)
            const currentUser = authUtils.getUser()
            if (currentUser) {
                fetchOrders(currentUser.userId || currentUser.id)
                fetchUserReviews(currentUser.userId || currentUser.id)
            }
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "processing":
                return <Clock className="h-4 w-4 text-blue-500" />
            case "cancelled":
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <AlertCircle className="h-4 w-4 text-yellow-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>
            case "processing":
                return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Processing</Badge>
            case "cancelled":
                return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>
            default:
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
        }
    }

    const handleDownload = async (orderId: string) => {
        try {
            const token = authUtils.getToken()
            const response = await fetch(`https://nyaymitra-backend-document-production.up.railway.app/api/documents/download/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.style.display = 'none'
                a.href = url
                a.download = `document-${orderId}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)

                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order._id === orderId
                            ? { ...order, downloadCount: order.downloadCount + 1 }
                            : order
                    )
                )
            } else {
                console.error('Download failed')
            }
        } catch (error) {
            console.error('Download error:', error)
        }
    }

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order)
        setIsDetailsOpen(true)
    }

    const handleOpenReview = (order: Order) => {
        setSelectedOrder(order)
        setReviewData({
            rating: 0,
            comment: "",
            orderId: order._id
        })
        setIsReviewOpen(true)
    }

    const handleSubmitReview = async () => {
        if (!reviewData.rating || !reviewData.comment) {
            alert("Please provide both rating and comment")
            return
        }

        setIsSubmittingReview(true)
        try {
            const token = authUtils.getToken()
            const currentUser = authUtils.getUser()

            if (!currentUser) {
                throw new Error("User not authenticated")
            }

            const response = await fetch(`https://nyaymitra-backend-document-production.up.railway.app/api/reviews`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId: reviewData.orderId,
                    userId: currentUser.userId || currentUser.id,
                    rating: reviewData.rating,
                    comment: reviewData.comment
                })
            })

            if (response.ok) {
                alert("Review submitted successfully!")
                setIsReviewOpen(false)
                setReviewData({ rating: 0, comment: "", orderId: "" })
                await refreshUserReviews()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.message || "Failed to submit review")
            }
        } catch (error) {
            console.error('Review submission error:', error)
            if (error instanceof Error) {
                alert(error.message || "Failed to submit review. Please try again.")
            } else {
                alert("Failed to submit review. Please try again.")
            }
        } finally {
            setIsSubmittingReview(false)
        }
    }

    if (!hasMounted) {
        return (
            <DashboardLayout userType="user" user={undefined}>
                <div className="p-4 md:p-6">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64 mb-6" />
                    <div className="grid gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-lg" />
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    if (!user && !isLoading) {
        return (
            <DashboardLayout userType="user" user={undefined}>
                <div className="p-4 md:p-6">
                    <GlassCard className="p-6 md:p-12 text-center border-white/10">
                        <AlertCircle className="h-8 w-8 md:h-12 md:w-12 text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Authentication Required</h3>
                        <p className="text-slate-400 mb-6">Please log in to view your orders.</p>
                        <Button asChild>
                            <Link href="/auth/login">Login</Link>
                        </Button>
                    </GlassCard>
                </div>
            </DashboardLayout>
        )
    }

    if (isLoading) {
        return (
            <DashboardLayout userType="user" user={user || undefined}>
                <div className="p-4 md:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white">My Orders</h1>
                            <p className="text-slate-400">Manage your document orders</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Skeleton className="h-10 w-full sm:w-64" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {[1, 2, 3].map((i) => (
                            <GlassCard key={i} className="p-4 md:p-6 border-white/10">
                                <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-4 w-64" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-6 w-20" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-10 w-32" />
                                    </div>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout userType="user" user={user || undefined}>
            <div className="p-4 md:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">My Orders</h1>
                        <p className="text-slate-400">Manage your document orders</p>
                    </div>

                    {isMobile && (
                        <Button
                            variant="outline"
                            onClick={() => setIsFilterOpen(true)}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                    )}

                    <div className={`${isMobile ? 'hidden' : 'flex'} flex-col sm:flex-row gap-2 w-full sm:w-auto`}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search orders..."
                                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-blue-400/25 w-full sm:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Status: {statusFilter === "all" ? "All" : statusFilter}
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-800 border-white/10">
                                <DropdownMenuItem onClick={() => setStatusFilter("all")} className="text-white focus:bg-white/10">
                                    All Orders
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("pending")} className="text-white focus:bg-white/10">
                                    Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("processing")} className="text-white focus:bg-white/10">
                                    Processing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("completed")} className="text-white focus:bg-white/10">
                                    Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("cancelled")} className="text-white focus:bg-white/10">
                                    Cancelled
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {isMobile && (
                    <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <DrawerContent className="bg-slate-800 border-white/10 text-white p-4">
                            <DrawerHeader className="text-left">
                                <DrawerTitle>Filters</DrawerTitle>
                                <DrawerDescription className="text-slate-400">
                                    Filter your orders by status
                                </DrawerDescription>
                            </DrawerHeader>
                            <div className="grid gap-4 py-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Search orders..."
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant={statusFilter === "all" ? "default" : "outline"}
                                        onClick={() => setStatusFilter("all")}
                                        className="justify-center"
                                    >
                                        All
                                    </Button>
                                    <Button
                                        variant={statusFilter === "pending" ? "default" : "outline"}
                                        onClick={() => setStatusFilter("pending")}
                                        className="justify-center"
                                    >
                                        Pending
                                    </Button>
                                    <Button
                                        variant={statusFilter === "processing" ? "default" : "outline"}
                                        onClick={() => setStatusFilter("processing")}
                                        className="justify-center"
                                    >
                                        Processing
                                    </Button>
                                    <Button
                                        variant={statusFilter === "completed" ? "default" : "outline"}
                                        onClick={() => setStatusFilter("completed")}
                                        className="justify-center"
                                    >
                                        Completed
                                    </Button>
                                    <Button
                                        variant={statusFilter === "cancelled" ? "default" : "outline"}
                                        onClick={() => setStatusFilter("cancelled")}
                                        className="justify-center col-span-2"
                                    >
                                        Cancelled
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="mt-4"
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    Refresh Orders
                                </Button>
                            </div>
                        </DrawerContent>
                    </Drawer>
                )}

                {filteredOrders.length === 0 ? (
                    <GlassCard className="p-6 md:p-12 text-center border-white/10">
                        <FileText className="h-8 w-8 md:h-12 md:w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">
                            {orders.length === 0 ? "No orders found" : "No orders match your search"}
                        </h3>
                        <p className="text-slate-400 mb-6">
                            {orders.length === 0
                                ? "You haven't placed any orders yet."
                                : "Try adjusting your search or filter criteria."}
                        </p>
                        {orders.length === 0 && (
                            <Button asChild>
                                <Link href="/user/lawyers">Browse Services</Link>
                            </Button>
                        )}
                    </GlassCard>
                ) : (
                    <div className="grid gap-4">
                        {filteredOrders.map((order) => (
                            <GlassCard key={order._id} className="p-4 md:p-6 border-white/10">
                                <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-500/20">
                                        <FileText className="h-6 w-6 text-blue-400" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-medium text-white truncate">{order.serviceName}</h3>
                                                <p className="text-slate-400 text-sm truncate">{order.documentType}</p>
                                            </div>
                                            <div className="sm:ml-2 flex-shrink-0">
                                                {getStatusBadge(order.status)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            <div className="min-w-0">
                                                <p className="text-slate-400">Order ID</p>
                                                <p className="text-white font-mono text-xs truncate">{order.razorpayOrderId}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">Placed on</p>
                                                <p className="text-white flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                                    <span className="truncate">{formatDate(order.createdAt)}</span>
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">Amount</p>
                                                <p className="text-white">₹{order.finalAmount}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400">Delivery</p>
                                                <p className="text-white capitalize truncate">{order.deliveryMethod}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-stretch sm:items-end gap-2">
                                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleViewDetails(order)}
                                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-center sm:justify-start flex-1 sm:flex-none"
                                                size={isMobile ? "default" : "sm"}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Details
                                            </Button>
                                            <Button
                                                onClick={() => handleDownload(order._id)}
                                                disabled={order.status !== "completed" || order.downloadCount >= 3}
                                                className="bg-blue-500 hover:bg-blue-600 text-white justify-center sm:justify-start flex-1 sm:flex-none"
                                                size={isMobile ? "default" : "sm"}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download {order.downloadCount > 0 && `(${order.downloadCount}/3)`}
                                            </Button>
                                        </div>
                                        {order.status === "completed" && (
                                            hasUserReviewedOrder(order._id) ? (
                                                <Button
                                                    variant="outline"
                                                    className="bg-green-500/20 text-green-400 border-green-500/30 justify-center sm:justify-start cursor-default"
                                                    size={isMobile ? "default" : "sm"}
                                                    disabled
                                                >
                                                    <Star className="h-4 w-4 mr-2 fill-green-400" />
                                                    Reviewed
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleOpenReview(order)}
                                                    className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30 justify-center sm:justify-start"
                                                    size={isMobile ? "default" : "sm"}
                                                >
                                                    <Star className="h-4 w-4 mr-2" />
                                                    Add Review
                                                </Button>
                                            )
                                        )}
                                        <p className="text-slate-400 text-sm text-right mt-2 sm:mt-0">
                                            Updated: {formatDateTime(order.updatedAt)}
                                        </p>
                                    </div>
                                </div>

                                {order.statusHistory && order.statusHistory.length > 0 && (
                                    <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
                                        <h4 className="text-sm font-medium text-slate-400 mb-2">Status History</h4>
                                        <div className="flex overflow-x-auto gap-4 pb-2">
                                            {order.statusHistory.map((history, index) => (
                                                <div key={history._id} className="flex flex-col items-center min-w-max">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(history.status)}
                                                        <span className="text-sm text-white capitalize">{history.status}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {formatDateTime(history.changedAt)}
                                                    </p>
                                                    {history.reason && (
                                                        <p className="text-xs text-slate-500 mt-1 text-center max-w-[120px] truncate">
                                                            {history.reason}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </GlassCard>
                        ))}
                    </div>
                )}

                {/* Order Details Dialog */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="bg-slate-800 border-white/10 text-white max-w-2xl w-[calc(100%-2rem)] md:w-full">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Order Details</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Detailed information about your order
                            </DialogDescription>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-slate-300">Service Information</h4>
                                        <p className="text-white">{selectedOrder.serviceName}</p>
                                        <p className="text-slate-400 text-sm">{selectedOrder.documentType}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-300">Order Status</h4>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-slate-300">Order ID</h4>
                                        <p className="text-white font-mono text-sm break-all">{selectedOrder.razorpayOrderId}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-300">Payment ID</h4>
                                        <p className="text-white font-mono text-sm break-all">{selectedOrder.razorpayPaymentId || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-slate-300">Amount</h4>
                                        <p className="text-white">₹{selectedOrder.finalAmount}</p>
                                        {selectedOrder.discountApplied > 0 && (
                                            <p className="text-slate-400 text-sm">Discount: ₹{selectedOrder.discountApplied}</p>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-300">Delivery Method</h4>
                                        <p className="text-white capitalize">{selectedOrder.deliveryMethod}</p>
                                        <p className="text-slate-400 text-sm">Status: {selectedOrder.deliveryStatus}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium text-slate-300">Order Date</h4>
                                        <p className="text-white">{formatDateTime(selectedOrder.createdAt)}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-300">Last Updated</h4>
                                        <p className="text-white">{formatDateTime(selectedOrder.updatedAt)}</p>
                                    </div>
                                </div>

                                {selectedOrder.completedAt && (
                                    <div>
                                        <h4 className="font-medium text-slate-300">Completed Date</h4>
                                        <p className="text-white">{formatDateTime(selectedOrder.completedAt)}</p>
                                    </div>
                                )}

                                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-slate-300 mb-2">Status History</h4>
                                        <div className="space-y-2">
                                            {selectedOrder.statusHistory.map((history, index) => (
                                                <div key={history._id} className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                                                    {getStatusIcon(history.status)}
                                                    <div className="min-w-0">
                                                        <p className="text-white text-sm capitalize truncate">{history.status}</p>
                                                        <p className="text-slate-400 text-xs">{formatDateTime(history.changedAt)}</p>
                                                        {history.reason && (
                                                            <p className="text-slate-400 text-xs truncate">Reason: {history.reason}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Review Dialog */}
                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                    <DialogContent className="bg-slate-800 border-white/10 text-white w-[calc(100%-2rem)] max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Add Review</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Share your experience with this service
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                                <div className="flex gap-1 justify-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                                            className="p-1 focus:outline-none"
                                        >
                                            <Star
                                                className={`h-6 w-6 ${star <= reviewData.rating
                                                    ? "text-yellow-400 fill-yellow-400"
                                                    : "text-slate-400"
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Comment</label>
                                <Textarea
                                    placeholder="Share your experience with this service..."
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                    className="bg-slate-700/50 border-white/10 text-white placeholder:text-slate-400"
                                    rows={4}
                                />
                            </div>

                            <Button
                                onClick={handleSubmitReview}
                                disabled={isSubmittingReview || !reviewData.rating || !reviewData.comment}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                {isSubmittingReview ? "Submitting..." : "Submit Review"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}

export default function MyOrdersPage() {
    return <OrdersContent />
}