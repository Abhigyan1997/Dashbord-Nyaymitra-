"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Briefcase, Clock, Shield, DollarSign, Eye, EyeOff, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { lawyerApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

interface SlotAvailability {
  day: string
  slots: string[]
  _id?: string
}

interface LawyerProfile {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  specialization: string
  consultationFee: number
  durationMinutes: number
  bankDetails?: {
    accountNumber?: string
    accountHolderName?: string
    bankName?: string
    ifscCode?: string
    branch?: string
  }
}

export default function LawyerSettingsPage() {
  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [availability, setAvailability] = useState<SlotAvailability[]>([])

  const [professionalData, setProfessionalData] = useState({
    consultationFee: 0,
    durationMinutes: 30,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [bankData, setBankData] = useState({
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    upiId: ""
  })

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setProfileLoading(true)
        const profileResponse = await lawyerApi.getProfile()
        const profile = profileResponse.data
        setLawyer(profile)

        setProfessionalData({
          consultationFee: profile.consultationFee,
          durationMinutes: profile.durationMinutes || 30
        })


        if (profile.bankDetails) {
          setBankData({
            accountHolder: profile.bankDetails.accountHolder || "",
            accountNumber: profile.bankDetails.accountNumber || "",
            ifsc: profile.bankDetails.ifsc || "",
            upiId: profile.bankDetails.upiId || ""
          })
        }

        if (profile.userId) {
          const availabilityResponse = await lawyerApi.getLawyerAvailability(profile.userId)
          setAvailability(availabilityResponse.data?.data?.availability || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        })
      } finally {
        setProfileLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSaveSlot = async (day: string, slotIndex: number, newSlot: string) => {
    try {
      const [start, end] = newSlot.split('-');

      // Validate time slot
      if (!start || !end || start >= end) {
        toast({
          title: "Invalid Time",
          description: "Please select valid start and end times",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      const updatedAvailability = availability.map(d =>
        d.day === day
          ? {
            ...d,
            slots: d.slots.map((slot, idx) =>
              idx === slotIndex ? `${start}-${end}` : slot
            ).filter(slot => slot) // Remove any empty slots
          }
          : d
      );
      setAvailability(updatedAvailability);

      // Prepare data for API - only include days with valid slots
      const timeSlotsToSend = updatedAvailability
        .map(d => ({
          day: d.day,
          slots: d.slots
            .filter(slot => slot.includes('-'))
            .filter(slot => {
              const [s, e] = slot.split('-');
              return s && e && s < e;
            })
        }))
        .filter(d => d.slots.length > 0);

      // If no valid slots for this day, send empty array
      const currentDaySlots = timeSlotsToSend.find(d => d.day === day)?.slots || [];

      await lawyerApi.setAvailability({
        timeSlots: [{
          day,
          slots: currentDaySlots
        }]
      });

      toast({
        title: "Saved",
        description: `Time slots updated for ${day}`,
        duration: 2000
      });
    } catch (error: any) {
      console.error("Error saving slot:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save time slot",
        variant: "destructive"
      });
    }
  };

  const handleAddSlot = (day: string) => {
    setAvailability(prev => {
      const existingDay = prev.find(d => d.day === day);
      if (existingDay) {
        return prev.map(d =>
          d.day === day
            ? { ...d, slots: [...d.slots, ""] } // Add empty slot
            : d
        );
      }
      return [...prev, { day, slots: [""] }];
    });
  };

  const handleRemoveSlot = async (day: string, index: number) => {
    // Update local state first
    setAvailability(prev =>
      prev.map(d =>
        d.day === day
          ? { ...d, slots: d.slots.filter((_, i) => i !== index) }
          : d
      ).filter(d => d.slots.length > 0)
    );

    // Get remaining valid slots for this day
    const daySlots = availability.find(d => d.day === day)?.slots || [];
    const validSlots = daySlots
      .filter((_, i) => i !== index) // Remove the deleted slot
      .filter(slot => slot.includes('-'))
      .filter(slot => {
        const [s, e] = slot.split('-');
        return s && e && s < e;
      });

    // Update API
    try {
      await lawyerApi.setAvailability({
        timeSlots: [{
          day,
          slots: validSlots.length > 0 ? validSlots : []
        }]
      });

      toast({
        title: "Updated",
        description: `Time slots updated for ${day}`,
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update time slots",
        variant: "destructive"
      });
    }
  };

  const handleSlotChange = (day: string, index: number, value: string) => {
    setAvailability(prev =>
      prev.map(d =>
        d.day === day
          ? {
            ...d,
            slots: d.slots.map((slot, i) => i === index ? value : slot)
          }
          : d
      )
    )
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }
    setLoading(true)
    try {
      await lawyerApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast({
        title: "Success",
        description: "Password changed successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfessionalUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await lawyerApi.updateProfile({
        consultationFee: professionalData.consultationFee,
        durationMinutes: professionalData.durationMinutes
      })
      setLawyer(prev => prev ? {
        ...prev,
        consultationFee: professionalData.consultationFee,
        durationMinutes: professionalData.durationMinutes
      } : null)
      toast({
        title: "Success",
        description: "Professional details updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update professional details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBankUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Transform data to match backend schema exactly
      const bankDetailsPayload = {
        accountHolder: bankData.accountHolder,
        accountNumber: bankData.accountNumber,
        ifsc: bankData.ifsc,
        upiId: bankData.upiId
      }

      const response = await lawyerApi.updateProfile({
        bankDetails: bankDetailsPayload
      })

      setLawyer(prev => prev ? {
        ...prev,
        bankDetails: bankDetailsPayload
      } : null)

      toast({
        title: "Success",
        description: "Bank details updated successfully",
      })
    } catch (error: any) {
      console.error("Bank update error:", error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update bank details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <ProtectedRoute requiredUserType="lawyer">
        <DashboardLayout userType="lawyer">
          <div className="flex justify-center items-center h-64">
            <p>Loading profile...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!lawyer) {
    return (
      <ProtectedRoute requiredUserType="lawyer">
        <DashboardLayout userType="lawyer">
          <div className="flex justify-center items-center h-64">
            <p>Failed to load profile</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredUserType="lawyer">
      <DashboardLayout userType="lawyer" user={lawyer}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your professional settings</p>
          </div>

          <Tabs defaultValue="professional" className="space-y-4">
            <TabsList>
              <TabsTrigger value="professional">
                <Briefcase className="w-4 h-4 mr-2" />
                Professional
              </TabsTrigger>
              <TabsTrigger value="availability">
                <Clock className="w-4 h-4 mr-2" />
                Availability
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="payments">
                <DollarSign className="w-4 h-4 mr-2" />
                Payments
              </TabsTrigger>
            </TabsList>

            {/* Professional Tab */}
            <TabsContent value="professional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Settings</CardTitle>
                  <CardDescription>Update your consultation details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfessionalUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                        <Input
                          id="consultationFee"
                          type="number"
                          value={professionalData.consultationFee}
                          onChange={(e) => setProfessionalData(prev => ({
                            ...prev,
                            consultationFee: Number(e.target.value)
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={professionalData.durationMinutes}
                          onChange={(e) => setProfessionalData(prev => ({
                            ...prev,
                            durationMinutes: Number(e.target.value)
                          }))}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Working Hours</CardTitle>
                  <CardDescription>
                    Set your available time slots for each day
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {daysOrder.map((day) => {
                    const dayAvailability = availability.find(d => d.day === day) || { day, slots: [] }

                    return (
                      <div key={day} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-lg">{day}</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSlot(day)}
                          >
                            Add Time Slot
                          </Button>
                        </div>

                        {dayAvailability.slots.length > 0 ? (
                          <div className="space-y-3">
                            {dayAvailability.slots.map((slot, index) => {
                              const [startTime, endTime] = slot.includes('-') ? slot.split('-') : ['', ''];
                              const isComplete = startTime && endTime;

                              return (
                                <div key={index} className="flex items-end gap-3 p-3 bg-muted/50 rounded-lg">
                                  <div className="flex-1">
                                    <Label>From</Label>
                                    <Select
                                      value={startTime}
                                      onValueChange={(value) => {
                                        const newSlot = `${value}-${endTime}`;
                                        handleSlotChange(day, index, newSlot);
                                        if (endTime) handleSaveSlot(day, index, newSlot);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Start time" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60 overflow-y-auto">
                                        {generateTimeOptions().map((time) => (
                                          <SelectItem key={time.value} value={time.value}>
                                            {time.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex-1">
                                    <Label>To</Label>
                                    <Select
                                      value={endTime}
                                      onValueChange={(value) => {
                                        const newSlot = `${startTime}-${value}`;
                                        handleSlotChange(day, index, newSlot);
                                        if (startTime) handleSaveSlot(day, index, newSlot);
                                      }}
                                      disabled={!startTime}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="End time" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-60 overflow-y-auto">
                                        {generateTimeOptions()
                                          .filter(time => !startTime || time.value > startTime)
                                          .map((time) => (
                                            <SelectItem key={time.value} value={time.value}>
                                              {time.label}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveSlot(day, index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>

                                  {isComplete && (
                                    <Badge variant="outline" className="ml-2">
                                      Saved
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center p-4 border rounded bg-muted/50">
                            <p className="text-sm text-muted-foreground">Click "Add Time Slot" to add availability</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bank Details</CardTitle>
                  <CardDescription>Update your bank account for receiving payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBankUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="accountHolder">Account Holder Name</Label>
                        <Input
                          id="accountHolder"
                          value={bankData.accountHolder}
                          onChange={(e) => setBankData(prev => ({ ...prev, accountHolder: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={bankData.accountNumber}
                          onChange={(e) => setBankData(prev => ({ ...prev, accountNumber: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ifsc">IFSC Code</Label>
                        <Input
                          id="ifsc"
                          value={bankData.ifsc}
                          onChange={(e) => setBankData(prev => ({ ...prev, ifsc: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="upiId">UPI ID (Optional)</Label>
                        <Input
                          id="upiId"
                          value={bankData.upiId}
                          onChange={(e) => setBankData(prev => ({ ...prev, upiId: e.target.value }))}
                          placeholder="yourname@upi"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Updating..." : "Update Bank Details"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push({
        value: timeValue,
        label: new Date(`2000-01-01T${timeValue}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      });
    }
  }
  return options;
};