"use client";

import { useState, useEffect } from "react";
import {
  User, Star, Calendar, DollarSign, Edit, Camera, Briefcase,
  Languages, MapPin, CheckCircle2, Clock, XCircle, FileText, ShieldCheck
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

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    barCouncilId: "",
    specialization: [""],
    city: "",
    state: "",
    experience: "",
    languagesSpoken: [""],
    consultationFee: 0,
    bio: "",
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
          phone: profileRes.data.phone,
          barCouncilId: profileRes.data.barCouncilId,
          specialization: profileRes.data.specialization,
          city: profileRes.data.city,
          state: profileRes.data.state,
          experience: profileRes.data.experience,
          languagesSpoken: profileRes.data.languagesSpoken,
          consultationFee: profileRes.data.consultationFee,
          bio: profileRes.data.bio || "",
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
              <Badge variant={lawyer.status === 'online' ? 'default' : 'secondary'}>
                {lawyer.status === 'online' ? 'Online' : 'Offline'}
              </Badge>
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
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Profile Header Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="relative">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={lawyer.avatar || "/placeholder.svg"} alt={lawyer.fullName} />
                        <AvatarFallback className="text-2xl">{lawyer.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {lawyer.verificationStatus === 'verified' && (
                        <div className="absolute -bottom-2 -right-2">
                          <div className="bg-white p-1 rounded-full">
                            <ShieldCheck className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold">{lawyer.fullName}</h2>
                          {lawyer.verifiedByPlatform && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {lawyer.specialization.map((spec, i) => (
                            <Badge key={i} variant="outline" className="text-sm">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{lawyer.averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({lawyer.totalReviews} reviews)</span>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{lawyer.city}, {lawyer.state}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border rounded-lg p-3">
                          <p className="text-sm font-medium text-muted-foreground">Experience</p>
                          <p className="text-lg font-semibold">{lawyer.experience} years</p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <p className="text-sm font-medium text-muted-foreground">Consultation Fee</p>
                          <p className="text-lg font-semibold">₹{lawyer.consultationFee}</p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <p className="text-sm font-medium text-muted-foreground">Cases Handled</p>
                          <p className="text-lg font-semibold">{lawyer.consultationCount}</p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                          <p className="text-lg font-semibold">{stats.successRate}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Profile Views"
                  value={lawyer.profileViews}
                  icon={<User className="h-5 w-5 text-primary" />}
                  change={stats.monthlyGrowth}
                  description="from last month"
                />
                <StatCard
                  title="Total Earnings"
                  value={`₹${stats.totalEarnings}`}
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  description={`₹${stats.thisMonthEarnings} this month`}
                />
                <StatCard
                  title="Avg. Rating"
                  value={lawyer.averageRating.toFixed(1)}
                  icon={<Star className="h-5 w-5 text-primary" />}
                  change={stats.ratingGrowth}
                  description="from last month"
                />
                <StatCard
                  title="Total Cases"
                  value={lawyer.consultationCount}
                  icon={<Briefcase className="h-5 w-5 text-primary" />}
                  change={stats.caseGrowth}
                  description="from last month"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Professional Details Card */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Bar Council ID</p>
                        <p className="text-sm font-medium">{lawyer.barCouncilId}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Consultation Fee</p>
                        <p className="text-sm font-medium">₹{lawyer.consultationFee}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{lawyer.city}, {lawyer.state}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Languages</p>
                        <div className="flex items-center gap-1">
                          <Languages className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {lawyer.languagesSpoken.length > 0 ? lawyer.languagesSpoken.join(", ") : "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Consultation Modes</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {lawyer.consultationModes.video && <ConsultationModeBadge mode="video" />}
                        {lawyer.consultationModes.call && <ConsultationModeBadge mode="call" />}
                        {lawyer.consultationModes.chat && <ConsultationModeBadge mode="chat" />}
                        {lawyer.consultationModes.inPerson && <ConsultationModeBadge mode="inPerson" />}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Contact</p>
                      <p className="text-sm font-medium">{lawyer.email}</p>
                      <p className="text-sm font-medium">{lawyer.phone}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* About Me Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profileData.bio ? (
                      <p className="text-sm text-muted-foreground">{profileData.bio}</p>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          No bio added yet. Add a professional bio to help clients understand your expertise.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key indicators of your professional performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Client Satisfaction</span>
                        <span className="text-sm font-medium">{stats.clientSatisfaction}%</span>
                      </div>
                      <Progress value={stats.clientSatisfaction} className="h-2" />
                      <p className="text-xs text-muted-foreground">Based on client feedback and ratings</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Response Rate</span>
                        <span className="text-sm font-medium">{stats.responseRate}%</span>
                      </div>
                      <Progress value={stats.responseRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">Timely responses to client inquiries</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Case Success Rate</span>
                        <span className="text-sm font-medium">{stats.successRate}%</span>
                      </div>
                      <Progress value={stats.successRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">Positive outcomes for your clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Edit Profile Tab */}
            <TabsContent value="edit" className="space-y-4">
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
                          value={profileData.consultationFee}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, consultationFee: Number(e.target.value) }))}
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
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Profile completion: {lawyer.profileCompletedPercentage}%
                        </p>
                        <Progress value={lawyer.profileCompletedPercentage} className="h-2 mt-1 w-48" />
                      </div>
                      <Button type="submit" disabled={updating}>
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
                      <div className="text-3xl font-bold">{lawyer.averageRating.toFixed(1)}</div>
                      <div className="flex justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= Math.floor(lawyer.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">Overall Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{lawyer.totalReviews}</div>
                      <p className="text-sm text-muted-foreground">Total Reviews</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">98%</div>
                      <p className="text-sm text-muted-foreground">Recommend Rate</p>
                    </div>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>{review.clientName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{review.clientName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
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

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Profile Views"
                  value={lawyer.profileViews}
                  icon={<User className="h-5 w-5 text-primary" />}
                  change={stats.monthlyGrowth}
                  description="from last month"
                />
                <StatCard
                  title="Total Earnings"
                  value={`₹${stats.totalEarnings}`}
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  description={`₹${stats.thisMonthEarnings} this month`}
                />
                <StatCard
                  title="Avg. Rating"
                  value={lawyer.averageRating.toFixed(1)}
                  icon={<Star className="h-5 w-5 text-primary" />}
                  change={stats.ratingGrowth}
                  description="from last month"
                />
                <StatCard
                  title="Total Cases"
                  value={lawyer.consultationCount}
                  icon={<Briefcase className="h-5 w-5 text-primary" />}
                  change={stats.caseGrowth}
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