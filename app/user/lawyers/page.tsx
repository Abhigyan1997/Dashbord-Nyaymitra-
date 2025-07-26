"use client"

import { useState, useEffect } from "react"
import Link from 'next/link';
import { Search, Filter, Star, MapPin, Clock, Video, Phone, Calendar, MessageSquare, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { mockUser } from "@/lib/mock-data"
import { authUtils } from "@/lib/auth"
import { userApi } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Lawyer {
  id: string;
  name: string;
  fullName: string;
  specialty: string;
  experience: number;
  rating: number;
  reviews: number;
  hourlyRate: number;
  avatar: string;
  location: string;
  availability: string;
  consultationTypes: string[];
  bio: string;
  email?: string;
  phone?: string;
  languages?: string[];
  education?: string[];
  barAssociation?: string;
  licenseNumber?: string;
  inPersonAvailable?: boolean;
  inPersonLocation?: string;
  profileImage: string;
}

export default function FindLawyersPage() {
  const { toast } = useToast()
  // const [user, setUser] = useState(mockUser)
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [loading, setLoading] = useState(true)
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    phone: string;
    address: string;
  }>({
    id: "",
    name: "",
    email: "",
    avatar: "/default-avatar.png",
    phone: "",
    address: ""
  });


  useEffect(() => {
    const fetchUserAndLawyers = async () => {
      try {
        const currentUser = authUtils.getUser()
        if (currentUser) {
          setUser({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            avatar: currentUser.avatar ?? "/default-avatar.png", // fallback
            phone: currentUser.phone ?? "",
            address: typeof currentUser.address === "string" ? currentUser.address : "", // handle object if needed
          })
        }


        await loadLawyers()
      } catch (error) {
        console.error("Initialization error:", error)
        toast({
          title: "Error",
          description: "Failed to initialize page",
          variant: "destructive"
        })
      }
    }

    fetchUserAndLawyers()
  }, [])

  const loadLawyers = async () => {
    setLoading(true)
    try {
      const response = await userApi.getAllLawyers()
      const data = response.data

      if (data.success && data.lawyers) {
        const formattedLawyers = data.lawyers.map((lawyer: any) => ({
          id: lawyer.lawyerDetails._id,
          name: lawyer.userInfo.fullName,
          specialty: lawyer.lawyerDetails.specialization.join(', '),
          experience: parseInt(lawyer.lawyerDetails.experience) || 0,
          rating: lawyer.lawyerDetails.averageRating || 0,
          reviews: lawyer.lawyerDetails.totalReviews || 0,
          hourlyRate: lawyer.lawyerDetails.consultationFee || 0,
          avatar: lawyer.userInfo.profilePicture || "/placeholder.svg",
          location: `${lawyer.lawyerDetails.city}, ${lawyer.lawyerDetails.state}`,
          availability: "Available today",
          consultationTypes: [
            lawyer.lawyerDetails.consultationModes.video ? "Video Call" : null,
            lawyer.lawyerDetails.consultationModes.call ? "Phone Call" : null,
            lawyer.lawyerDetails.consultationModes.chat ? "Chat" : null,
            lawyer.lawyerDetails.consultationModes.inPerson ? "In Person" : null
          ].filter(Boolean) as string[],
          bio: lawyer.lawyerDetails.bio || `${lawyer.userInfo.fullName} is a lawyer specializing in ${lawyer.lawyerDetails.specialization.join(', ')}`,
          email: lawyer.userInfo.email,
          phone: lawyer.userInfo.phone,
          languages: lawyer.lawyerDetails.languages,
          education: lawyer.lawyerDetails.education,
          barAssociation: lawyer.lawyerDetails.barAssociation,
          licenseNumber: lawyer.lawyerDetails.licenseNumber,
          inPersonAvailable: lawyer.lawyerDetails.consultationModes.inPerson,
          inPersonLocation: lawyer.lawyerDetails.inPersonLocation
        }))

        setLawyers(formattedLawyers)
      }
    } catch (error) {
      console.error("Error loading lawyers:", error)
      toast({
        title: "Error",
        description: "Failed to load lawyers",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLawyers = lawyers
    .filter((lawyer) => {
      const matchesSearch =
        lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSpecialty = specialtyFilter === "all" || lawyer.specialty.includes(specialtyFilter)
      return matchesSearch && matchesSpecialty
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "experience":
          return b.experience - a.experience
        case "price-low":
          return a.hourlyRate - b.hourlyRate
        case "price-high":
          return b.hourlyRate - a.hourlyRate
        default:
          return 0
      }
    })

  const specialties = Array.from(
    new Set(
      lawyers.flatMap(l => l.specialty.split(', '))
    )
  ).filter(Boolean)

  const viewProfile = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer)
    setProfileDialogOpen(true)
  }

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="user">
        <DashboardLayout
          userType="user"
          user={{
            name: user.name,
            email: user.email,
            avatar: user.avatar
          }}
        >
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        </DashboardLayout>

      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredUserType="user">
      <DashboardLayout userType="user" user={user}>
        <div className="space-y-6 p-4 md:p-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Find Lawyers</h1>
            <p className="text-muted-foreground">Connect with qualified legal professionals</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="experience">Most Experienced</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <div className="text-sm text-muted-foreground">Showing {filteredLawyers.length} lawyers</div>

          {/* Lawyers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLawyers.map((lawyer) => (
              <Card key={lawyer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Avatar - Make it smaller on mobile */}
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto sm:mx-0">
                      {lawyer.avatar && lawyer.avatar !== "/placeholder.svg" ? (
                        <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                      ) : (
                        <AvatarFallback className="bg-primary text-white">
                          {lawyer.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* Content - Add overflow constraints */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Name and Specialty */}
                      <div className="truncate">
                        <h3 className="font-semibold text-base md:text-lg truncate">{lawyer.name}</h3>
                        <Badge variant="secondary" className="text-xs md:text-sm truncate">{lawyer.specialty}</Badge>
                      </div>

                      {/* Rating and Experience - Stack vertically on mobile */}
                      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                          <span>{lawyer.rating} ({lawyer.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 md:h-4 md:w-4" />
                          <span>{lawyer.experience} years exp.</span>
                        </div>
                      </div>

                      {/* Location - Ensure it doesn't overflow */}
                      <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                        <span className="truncate">{lawyer.location}</span>
                      </div>

                      {/* Bio - Limit to 2 lines */}
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                        {lawyer.bio}
                      </p>

                      {/* Consultation Types - Wrap and add scroll if needed */}
                      <div className="flex flex-wrap gap-1 overflow-x-auto pb-1">
                        {lawyer.consultationTypes.map((type) => (
                          <Badge
                            key={type}
                            variant="outline"
                            className="text-xs whitespace-nowrap"
                          >
                            {type === "Video Call" && <Video className="mr-1 h-3 w-3" />}
                            {type === "Phone Call" && <Phone className="mr-1 h-3 w-3" />}
                            {type === "Chat" && <MessageSquare className="mr-1 h-3 w-3" />}
                            {type === "In Person" && <User className="mr-1 h-3 w-3" />}
                            {type}
                          </Badge>
                        ))}
                      </div>

                      {/* Price and Buttons - Adjust layout for mobile */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-2">
                        <div className="flex flex-col">
                          <span className="text-base md:text-lg font-semibold">₹{lawyer.hourlyRate}/hr</span>
                          <p className="text-xs text-green-600">{lawyer.availability}</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewProfile(lawyer)}
                            className="text-xs md:text-sm flex-1 sm:flex-none"
                          >
                            View Profile
                          </Button>
                          <BookingDialog
                            lawyerId={lawyer.id}
                            lawyerName={lawyer.name}
                            consultationFee={lawyer.hourlyRate}
                            consultationModes={lawyer.consultationTypes}
                            inPersonAvailable={lawyer.inPersonAvailable}
                            inPersonLocation={lawyer.inPersonLocation}
                          >
                            <Button size="sm" className="text-xs md:text-sm flex-1 sm:flex-none">
                              <Calendar className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                              Book Now
                            </Button>
                          </BookingDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLawyers.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No lawyers found</h3>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}

          {/* Lawyer Profile Dialog */}
          {selectedLawyer && (
            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedLawyer.name}'s Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Avatar className="h-24 w-24 mx-auto sm:mx-0">
                      {selectedLawyer.avatar && selectedLawyer.avatar !== "/placeholder.svg" ? (
                        <AvatarImage src={selectedLawyer.avatar} alt={selectedLawyer.name || "Lawyer"} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-semibold">
                        {(selectedLawyer.name?.charAt(0) || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-2 text-center sm:text-left">
                      <h3 className="text-2xl font-bold">{selectedLawyer.name}</h3>
                      <Badge variant="secondary" className="mx-auto sm:mx-0">{selectedLawyer.specialty}</Badge>
                      <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 md:gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>
                            {selectedLawyer.rating} ({selectedLawyer.reviews} reviews)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{selectedLawyer.experience} years experience</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm justify-center sm:justify-start">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedLawyer.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">About</h4>
                      <p className="text-muted-foreground">{selectedLawyer.bio}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold">Contact</h4>
                        <p className="text-muted-foreground">{selectedLawyer.email}</p>
                        <p className="text-muted-foreground">{selectedLawyer.phone}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Languages</h4>
                        <p className="text-muted-foreground">
                          {selectedLawyer.languages?.join(', ') || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold">Education</h4>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {selectedLawyer.education?.map((edu, index) => (
                          <li key={index}>{edu}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold">Bar Association</h4>
                        <p className="text-muted-foreground">
                          {selectedLawyer.barAssociation || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold">License Number</h4>
                        <p className="text-muted-foreground">
                          {selectedLawyer.licenseNumber || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {selectedLawyer.inPersonAvailable && (
                      <div>
                        <h4 className="font-semibold">In-Person Consultation</h4>
                        <p className="text-muted-foreground">
                          {selectedLawyer.inPersonLocation || 'Location not specified'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

interface BookingDialogProps {
  lawyerId: string
  lawyerName: string
  consultationFee: number
  consultationModes: string[]
  inPersonAvailable?: boolean
  inPersonLocation?: string
  children: React.ReactNode
}

function BookingDialog({
  lawyerId,
  lawyerName,
  consultationFee,
  consultationModes,
  inPersonAvailable,
  inPersonLocation,
  children
}: BookingDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState("");
  const [consultationMode, setConsultationMode] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showLocationInfo, setShowLocationInfo] = useState(false);
  const currentUser = authUtils.getUser();

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!date || !lawyerId) return;

      try {
        const dateString = date.toISOString().split('T')[0];

        // Get lawyer details to access the correct lawyer ID format
        const lawyerDetails = await userApi.getLawyerDetails(lawyerId);
        if (!lawyerDetails.data.success || !lawyerDetails.data.lawyer) {
          throw new Error("Failed to fetch lawyer details");
        }

        const correctLawyerId = lawyerDetails.data.lawyer.lawyerId; // Correct lawyer ID format
        const lawyerUserId = lawyerDetails.data.lawyer.userId; // Lawyer's user ID

        // Check slot availability with correct IDs
        const response = await userApi.checkSlotAvailability(lawyerUserId, dateString);

        if (response.data.success) {
          const slots = response.data.data.availableSlots.map((slotObj: any) => slotObj.slot);
          setAvailableSlots(slots || []);
        } else {
          toast({
            title: "Error",
            description: response.data.message || "Failed to load available slots",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast({
          title: "Error",
          description: "Failed to load available time slots",
          variant: "destructive"
        });
      }
    };

    fetchAvailableSlots();
  }, [date, lawyerId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async () => {
    // Validate required fields first
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Please login to book a consultation",
        variant: "destructive"
      });
      return;
    }

    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive"
      });
      return;
    }

    if (!timeSlot) {
      toast({
        title: "Error",
        description: "Please select a time slot",
        variant: "destructive"
      });
      return;
    }

    if (!consultationMode) {
      toast({
        title: "Error",
        description: "Please select a consultation mode",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Fetch user details
      const userDetails = await userApi.getUserDetails(currentUser.id);
      console.log("User Details Response:", userDetails.data)
      const correctUserId = userDetails.data?.user?.userId;

      // Get lawyer details
      const lawyerDetails = await userApi.getLawyerDetails(lawyerId);
      if (!lawyerDetails.data.success || !lawyerDetails.data.lawyer) {
        throw new Error("Failed to fetch lawyer details");
      }
      const correctLawyerId = lawyerDetails.data.lawyer.userId;
      // const lawyerUserId = lawyerDetails.data.lawyer.userId;
      console.log("correctUserId:", correctUserId);
      console.log("correctLawyerId:", correctLawyerId);


      // Create payment order
      const orderResponse = await userApi.createPaymentOrder({
        amount: consultationFee,
        userId: correctUserId,
        lawyerId: correctLawyerId,
        mode: consultationMode,
        slot: timeSlot,
        date: date.toISOString()
      });
      console.log("Creating order with:", {
        amount: consultationFee,
        userId: correctUserId,
        lawyerId: correctLawyerId,
        mode: consultationMode,
        slot: timeSlot,
        date: date.toISOString()
      });

      if (!orderResponse.data.success || !orderResponse.data.order) {
        throw new Error(orderResponse.data.message || "Failed to create payment order");
      }

      const order = orderResponse.data.order;

      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create handler function separately to maintain scope
      const paymentHandler = async (response: any) => {
        try {
          // Verify payment
          const verifyResponse = await userApi.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });

          if (!verifyResponse.data.success) {
            throw new Error(verifyResponse.data.message || "Payment verification failed");
          }

          // Create booking
          const bookingResponse = await userApi.bookConsultation({
            userId: correctUserId,
            lawyerId: correctLawyerId,
            date: date.toISOString(),
            slot: timeSlot,
            mode: consultationMode,
            paymentId: response.razorpay_payment_id,
            paymentMode: "razorpay"
          });
          console.log("Creating booking with:", {
            userId: correctUserId,
            lawyerId: correctLawyerId,
            date: date.toISOString(),
            slot: timeSlot,
            mode: consultationMode,
            paymentId: response.razorpay_payment_id,
            paymentMode: "razorpay"
          });


          if (!bookingResponse.data.success) {
            throw new Error(bookingResponse.data.message || "Booking failed");
          }

          toast({
            title: "Booking Successful",
            description: "Your consultation has been booked successfully"
          });
        } catch (error: any) {
          console.error("Payment verification error:", error);
          toast({
            title: "Error",
            description: error.message || "Payment verification failed",
            variant: "destructive"
          });
          // Consider refunding the payment if booking fails
        }
      };

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "LegalConnect",
        description: `Consultation with ${lawyerName}`,
        image: "/logo.png",
        order_id: order.id,
        handler: paymentHandler,
        prefill: {
          name: currentUser.fullName,
          email: currentUser.email,
          contact: currentUser.phone || ""
        },
        notes: {
          lawyerId: correctLawyerId,
          consultationMode,
          timeSlot,
          date: date.toISOString()
        },
        theme: {
          color: "#4f46e5"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        toast({
          title: "Payment Failed",
          description: response.error.description || "Payment could not be completed",
          variant: "destructive"
        });
      });
      rzp.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Payment processing failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!consultationMode) {
      toast({
        title: "Error",
        description: "Please select a consultation mode",
        variant: "destructive"
      });
      return;
    }

    if (!date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive"
      });
      return;
    }

    if (!timeSlot) {
      toast({
        title: "Error",
        description: "Please select a time slot",
        variant: "destructive"
      });
      return;
    }

    await initiatePayment();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Consultation</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Schedule a consultation with {lawyerName}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Consultation Mode */}
          <div>
            <h3 className="font-medium mb-3">Consultation Mode</h3>
            <RadioGroup
              value={consultationMode}
              onValueChange={(value) => {
                setConsultationMode(value);
                setShowLocationInfo(value === "inPerson");
              }}
              className="grid grid-cols-2 gap-3"
            >
              {consultationModes.includes("Video Call") && (
                <div>
                  <RadioGroupItem value="video" id="video" className="peer sr-only" />
                  <Label
                    htmlFor="video"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Video className="mb-2 h-6 w-6" />
                    Video Call
                  </Label>
                </div>
              )}

              {consultationModes.includes("Phone Call") && (
                <div>
                  <RadioGroupItem value="call" id="phone" className="peer sr-only" />
                  <Label
                    htmlFor="phone"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Phone className="mb-2 h-6 w-6" />
                    Phone Call
                  </Label>
                </div>
              )}

              {consultationModes.includes("Chat") && (
                <div>
                  <RadioGroupItem value="chat" id="chat" className="peer sr-only" />
                  <Label
                    htmlFor="chat"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <MessageSquare className="mb-2 h-6 w-6" />
                    Chat
                  </Label>
                </div>
              )}

              {consultationModes.includes("In Person") && (
                <div>
                  <RadioGroupItem value="inPerson" id="inPerson" className="peer sr-only" />
                  <Label
                    htmlFor="inPerson"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <User className="mb-2 h-6 w-6" />
                    In Person
                  </Label>
                </div>
              )}
            </RadioGroup>

            {showLocationInfo && inPersonLocation && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Meeting Location:</p>
                    <p className="text-blue-700">{inPersonLocation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <h3 className="font-medium mb-3">Date</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarPicker
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot */}
          {date && availableSlots.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Time Slot</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={timeSlot === slot ? "default" : "outline"}
                    onClick={() => setTimeSlot(slot)}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {date && availableSlots.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No available slots for this date. Please select another date.
            </div>
          )}

          {/* Total Amount */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-bold">₹{consultationFee}</span>
            </div>
          </div>

          {/* Proceed Button */}
          <Button
            className="w-full"
            onClick={handleBooking}
            disabled={loading || !consultationMode || !date || !timeSlot || availableSlots.length === 0}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : "Proceed to Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



