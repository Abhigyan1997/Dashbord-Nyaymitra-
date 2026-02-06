"use client";

import { useState, useEffect } from "react";
import {
  User, Star, Calendar, DollarSign, Edit, Camera, Briefcase,
  Languages, MapPin, CheckCircle2, Clock, XCircle, FileText, ShieldCheck, Phone, MessageSquare, Video
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { lawyerApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ConsultationModeBadge } from "@/components/consultation-mode-badge";
import { DocumentUploadCard } from "@/components/document-upload-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface LawyerProfile {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  barCouncilId: string;
  specialization: string[];
  city: string;
  state: string;
  experience: string;
  languagesSpoken: string[];
  consultationFee: number;
  consultationModes: {
    video: boolean;
    call: boolean;
    chat: boolean;
    inPerson: boolean;
  };
  consultationCount: number;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  verifiedByPlatform: boolean;
  profileCompletedPercentage: number;
  profilePhoto?: string;
  avatar?: string;
  bio?: string;
  status?: 'online' | 'offline';
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationDocuments?: {
    barCouncilIdCard?: string;
    aadharCard?: string;
    panCard?: string;
    otherDocuments?: string[];
  };
  verificationRejectionReason?: string;
  joinedDate: string;
  gender: string;
}

interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  description?: string;
}

const StatCard = ({ title, value, icon, change, description }: StatCardProps) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% {description}
            </p>
          )}
        </div>
        <div className="p-3 rounded-full bg-primary/10">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function LawyerProfilePage() {
  const { toast } = useToast();
  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const backendUrl = "http://localhost:5000";

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("profilePhoto", file); // ✅ correct key

      const response = await lawyerApi.uploadAvatar(formData);

      setLawyer(prev =>
        prev
          ? { ...prev, profilePhoto: response.data.photoUrl }
          : null
      );

      setAvatarPreview(null);

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });

    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };



  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    setSelectedFile(file);

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };


  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    profilePhoto: "",
    barCouncilId: "",
    specialization: [""],
    city: "",
    state: "",
    experience: "",
    languagesSpoken: [""],
    consultationFee: 0,
    bio: "",
    gender: "",
  });

  // Calculate stats based on profile data
  const calculateStats = (profile: LawyerProfile) => {
    return {
      totalEarnings: profile.consultationCount * profile.consultationFee,
      thisMonthEarnings: Math.floor(profile.consultationCount * profile.consultationFee * 0.3),
      totalBookings: profile.consultationCount,
      successRate: Math.min(95, Math.floor(profile.averageRating * 20)),
      clientSatisfaction: Math.min(100, Math.floor(profile.averageRating * 20)),
      responseRate: 90,
      monthlyGrowth: 12,
      ratingGrowth: 0.2,
      caseGrowth: 5
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes] = await Promise.all([
          lawyerApi.getProfile(),
        ]);

        setLawyer(profileRes.data);
        setProfileData({
          fullName: profileRes.data.fullName,
          email: profileRes.data.email,
          profilePhoto: profileRes.data.profilePhoto || profileRes.data.avatar || "",
          phone: profileRes.data.phone,
          barCouncilId: profileRes.data.barCouncilId,
          specialization: profileRes.data.specialization,
          city: profileRes.data.city,
          state: profileRes.data.state,
          experience: profileRes.data.experience,
          languagesSpoken: profileRes.data.languagesSpoken,
          consultationFee: profileRes.data.consultationFee,
          bio: profileRes.data.bio || "",
          gender: profileRes.data.gender || ""
        });
      } catch (err) {
        setError("Failed to fetch profile data");
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    try {
      const response = await lawyerApi.updateProfile(profileData);
      setLawyer(response.data);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err) {
      setError("Failed to update profile");
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDocumentUpload = async (docType: 'barCouncilIdCard' | 'aadharCard' | 'panCard', file: File) => {
    setUploadingDoc(docType);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', docType);

      const response = await lawyerApi.uploadVerificationDocument(formData);
      setLawyer(prev => prev ? {
        ...prev,
        verificationDocuments: {
          ...prev.verificationDocuments,
          [docType]: response.data.url
        }
      } : null);

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmitVerification = async () => {
    try {
      await lawyerApi.submitVerification();
      setLawyer(prev => prev ? {
        ...prev,
        verificationStatus: 'pending'
      } : null);
      toast({
        title: "Success",
        description: "Documents submitted for verification",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit verification",
        variant: "destructive",
      });
    }
  };

  const handleResubmitVerification = async () => {
    try {
      await lawyerApi.resubmitVerification();
      setLawyer(prev => prev ? {
        ...prev,
        verificationStatus: 'pending',
        verificationRejectionReason: undefined
      } : null);
      toast({
        title: "Success",
        description: "Documents resubmitted for verification",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resubmit verification",
        variant: "destructive",
      });
    }
  };

  if (loading || !lawyer) {
    return (
      <ProtectedRoute requiredUserType="lawyer">
        <DashboardLayout userType="lawyer" user={{
          name: "Loading...",
          email: "loading@example.com",
          avatar: "/placeholder.svg"
        }}>
          <div className="space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const stats = calculateStats(lawyer);

  return (
    <ProtectedRoute requiredUserType="lawyer">
      <DashboardLayout userType="lawyer" user={{
        name: lawyer.fullName,
        email: lawyer.email,
        avatar: lawyer.avatar
      }}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
              <p className="text-muted-foreground">Manage your professional profile and information</p>
            </div>
            <div className="flex items-center gap-4">
              {/* <Badge variant={lawyer.status === 'online' ? 'default' : 'secondary'}>
                {lawyer.status === 'online' ? 'Online' : 'Offline'}
              </Badge> */}
              {/* <Button onClick={() => setIsEditing(!isEditing)}>
                <Edit className="mr-2 h-4 w-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button> */}
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="edit">Edit Profile</TabsTrigger>
              {/* <TabsTrigger value="verification">Verification</TabsTrigger> */}
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              {/* <TabsTrigger value="analytics">Analytics</TabsTrigger> */}
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              {/* Profile Header Card - Enhanced */}
              <Card className="relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-20"></div>
                <CardContent className="p-6 relative">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                        <AvatarImage src={lawyer.profilePhoto || lawyer.avatar || "/placeholder-lawyer.svg"} alt={lawyer.fullName} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-secondary text-white">
                          {lawyer?.fullName ? lawyer.fullName.charAt(0) : ''}
                        </AvatarFallback>
                      </Avatar>
                      {lawyer.verificationStatus === 'verified' && (
                        <div className="absolute -bottom-2 -right-2">
                          <div className="bg-white p-1 rounded-full shadow-md">
                            <ShieldCheck className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      )}
                      <div className={`absolute top-0 right-0 p-1 rounded-full ${lawyer.status === 'online' ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white`}></div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-bold text-gray-900">{lawyer.fullName}</h2>
                          {lawyer.verifiedByPlatform && (
                            <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                              <ShieldCheck className="h-3 w-3" />
                              Verified Lawyer
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {lawyer.experience} years experience
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {(lawyer.specialization || []).map((spec, i) => (
                            <Badge key={i} variant="outline" className="text-sm bg-primary/10 text-primary">
                              {spec}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{(lawyer?.averageRating ?? 0).toFixed(1)}</span>
                            <span className="text-muted-foreground text-sm">({lawyer?.totalReviews ?? 0} reviews)</span>
                          </div>

                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>{lawyer.city}, {lawyer.state}</span>
                          </div>

                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Languages className="h-4 w-4" />
                            <span>{lawyer.languagesSpoken?.join(", ") || "English"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Key Metrics - Enhanced */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow transition-shadow">
                          <p className="text-xs font-medium text-muted-foreground">Consultation Fee</p>
                          <p className="text-lg font-semibold text-primary">₹{lawyer.consultationFee}</p>
                          <p className="text-xs text-muted-foreground">per session</p>
                        </div>
                        <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow transition-shadow">
                          <p className="text-xs font-medium text-muted-foreground">Cases Handled</p>
                          <p className="text-lg font-semibold">{lawyer.consultationCount}+</p>
                          <p className="text-xs text-muted-foreground">successful cases</p>
                        </div>
                        <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow transition-shadow">
                          <p className="text-xs font-medium text-muted-foreground">Success Rate</p>
                          <p className="text-lg font-semibold">{stats.successRate}%</p>
                          <p className="text-xs text-muted-foreground">positive outcomes</p>
                        </div>
                        <div className="border rounded-lg p-3 bg-white shadow-sm hover:shadow transition-shadow">
                          <p className="text-xs font-medium text-muted-foreground">Response Time</p>
                          <p className="text-lg font-semibold">1h</p>
                          <p className="text-xs text-muted-foreground">average</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Two Column Layout - Enhanced */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Professional Details Card - Enhanced */}
                <Card className="lg:col-span-2">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Professional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Bar Council ID
                        </Label>
                        <p className="font-medium">{lawyer.barCouncilId}</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Consultation Fee
                        </Label>
                        <p className="font-medium">₹{lawyer.consultationFee} per session</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <p className="font-medium">{lawyer.city}, {lawyer.state}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Experience
                        </Label>
                        <p className="font-medium">{lawyer.experience} years</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <Languages className="h-4 w-4" />
                          Languages
                        </Label>
                        <p className="font-medium">
                          {lawyer?.languagesSpoken?.length > 0 ? lawyer.languagesSpoken.join(", ") : "English"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Contact
                        </Label>
                        <p className="font-medium">{lawyer?.email || "Not specified"}</p>
                        <p className="font-medium">{lawyer?.phone || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Consultation Modes
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {lawyer?.consultationModes?.video && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              <Video className="h-3 w-3 mr-1" />
                              Video Call
                            </Badge>
                          )}
                          {lawyer?.consultationModes?.call && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              <Phone className="h-3 w-3 mr-1" />
                              Phone Call
                            </Badge>
                          )}
                          {lawyer?.consultationModes?.chat && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Chat
                            </Badge>
                          )}
                          {lawyer?.consultationModes?.inPerson && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              <MapPin className="h-3 w-3 mr-1" />
                              In-Person
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* About Me Card - Enhanced */}
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      About Me
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {profileData.bio ? (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700">{profileData.bio}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-10 w-10 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No bio added yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Add a professional bio to help clients understand your expertise and approach.
                        </p>
                        {/* <Button variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Add Bio
                        </Button> */}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Client Satisfaction Section - Enhanced */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Satisfaction</CardTitle>
                  <CardDescription>Key metrics that showcase your professional performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium">Client Rating</span>
                        </div>
                        <span className="text-sm font-medium">{lawyer.averageRating?.toFixed(1)}/5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={lawyer.averageRating ? lawyer.averageRating * 20 : 0} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {lawyer.totalReviews} reviews
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Success Rate</span>
                        </div>
                        <span className="text-sm font-medium">{stats.successRate}%</span>
                      </div>
                      <Progress value={stats.successRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">Positive case outcomes</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">Response Rate</span>
                        </div>
                        <span className="text-sm font-medium">{stats.responseRate}%</span>
                      </div>
                      <Progress value={stats.responseRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">Timely client responses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Edit Profile Tab */}
            <TabsContent value="edit" className="space-y-4">
              {/* Add this at the top of the edit form, before the grid */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={lawyer.profilePhoto || lawyer.avatar || "/placeholder-lawyer.svg"} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                      {lawyer?.fullName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-center">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>
                        <Camera className="mr-2 h-4 w-4" />
                        {avatarPreview ? "Change Photo" : "Upload Photo"}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar}
                  />
                  {avatarPreview && (
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        onClick={() => selectedFile && handleAvatarUpload(selectedFile)}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? "Uploading..." : "Save Photo"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedFile && handleAvatarUpload(selectedFile)}
                        disabled={uploadingAvatar}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG up to 2MB
                  </p>
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile Information</CardTitle>
                  <CardDescription>Update your professional details</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          value={profileData.specialization.join(", ")}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, specialization: e.target.value.split(", ") }))}
                          placeholder="Corporate Law, Intellectual Property"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          value={profileData.experience}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, experience: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                        <Input
                          id="consultationFee"
                          type="number"
                          value={profileData.consultationFee || ""}
                          onChange={(e) => setProfileData((prev) => ({
                            ...prev,
                            consultationFee: e.target.value === "" ? 0 : Number(e.target.value)
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="barCouncilId">Bar Council ID</Label>
                        <Input
                          id="barCouncilId"
                          value={profileData.barCouncilId}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, barCouncilId: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="languages">Languages Spoken</Label>
                        <Input
                          id="languages"
                          value={profileData.languagesSpoken.join(", ")}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, languagesSpoken: e.target.value.split(", ") }))}
                          placeholder="English, Hindi, Marathi"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={profileData.state}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, state: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={profileData.gender}
                          onValueChange={(value) => setProfileData(prev => ({ ...prev, gender: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        value={profileData.bio}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell clients about your experience and expertise..."
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      {/* <div>
                        <p className="text-sm text-muted-foreground">
                          Profile completion: {lawyer.profileCompletedPercentage}%
                        </p>
                        <Progress value={lawyer.profileCompletedPercentage} className="h-2 mt-1 w-48" />
                      </div> */}
                      <Button
                        type="submit"
                        disabled={updating}
                        className="w-full sm:w-auto" // Full width on mobile, auto on larger screens
                      >
                        {updating ? "Updating..." : "Update Profile"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Verification Tab */}
            <TabsContent value="verification" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Verification</CardTitle>
                  <CardDescription>
                    Upload required documents to get your profile verified and gain client trust
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {lawyer.verificationStatus === 'verified' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <h3 className="font-medium text-green-800">Your profile is verified</h3>
                          <p className="text-sm text-green-600">
                            Your documents have been verified by our team. Verified profiles get 3x more client inquiries.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {lawyer.verificationStatus === 'pending' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-blue-800">Verification in progress</h3>
                          <p className="text-sm text-blue-600">
                            Your documents are under review. This usually takes 1-2 business days.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {lawyer.verificationStatus === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <h3 className="font-medium text-red-800">Verification rejected</h3>
                          <p className="text-sm text-red-600">
                            {lawyer.verificationRejectionReason || 'Your documents were not approved.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Required Documents</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload clear photos or scans of the following documents for verification
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocumentUploadCard
                          title="Bar Council ID Card"
                          description="Front and back of your Bar Council ID card"
                          documentUrl={lawyer.verificationDocuments?.barCouncilIdCard}
                          onUpload={(file) => handleDocumentUpload('barCouncilIdCard', file)}
                          uploading={uploadingDoc === 'barCouncilIdCard'}
                        />

                        <DocumentUploadCard
                          title="Government ID Proof"
                          description="Aadhar Card, PAN Card, or Passport"
                          documentUrl={lawyer.verificationDocuments?.aadharCard}
                          onUpload={(file) => handleDocumentUpload('aadharCard', file)}
                          uploading={uploadingDoc === 'aadharCard'}
                        />
                      </div>
                    </div>

                    {lawyer.verificationStatus === 'unverified' && (
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSubmitVerification}
                          disabled={!lawyer.verificationDocuments?.barCouncilIdCard || !lawyer.verificationDocuments?.aadharCard}
                          className="w-full sm:w-auto"
                        >
                          Submit for Verification
                        </Button>
                      </div>
                    )}

                    {lawyer.verificationStatus === 'rejected' && (
                      <div className="flex justify-end">
                        <Button
                          onClick={handleResubmitVerification}
                          className="w-full sm:w-auto"
                        >
                          Resubmit for Verification
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Reviews</CardTitle>
                  <CardDescription>What your clients are saying about you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">
                        {(lawyer?.averageRating ?? 0).toFixed(1)}
                      </div>
                      <div className="flex justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= Math.floor(lawyer?.averageRating ?? 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">Overall Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{lawyer?.totalReviews ?? 0}</div>
                      <p className="text-sm text-muted-foreground">Total Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">98%</div>
                      <p className="text-sm text-muted-foreground">Recommend Rate</p>
                    </div>
                  </div>

                  {reviews?.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review?.id || Math.random()} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {review?.clientName?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {review?.clientName || 'Anonymous'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= (review?.rating ?? 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {review?.comment || 'No comment provided'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {review?.date || 'Date not available'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No reviews yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Profile Views"
                  value={lawyer?.profileViews ?? 0}
                  icon={<User className="h-5 w-5 text-primary" />}
                  change={stats?.monthlyGrowth ?? 0}
                  description="from last month"
                />
                <StatCard
                  title="Total Earnings"
                  value={`₹${stats?.totalEarnings ?? 0}`}
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  description={`₹${stats?.thisMonthEarnings ?? 0} this month`}
                />
                <StatCard
                  title="Avg. Rating"
                  value={(lawyer?.averageRating ?? 0).toFixed(1)}
                  icon={<Star className="h-5 w-5 text-primary" />}
                  change={stats?.ratingGrowth ?? 0}
                  description="from last month"
                />
                <StatCard
                  title="Total Cases"
                  value={lawyer?.consultationCount ?? 0}
                  icon={<Briefcase className="h-5 w-5 text-primary" />}
                  change={stats?.caseGrowth ?? 0}
                  description="from last month"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Your performance over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-[300px] bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Performance chart will be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}