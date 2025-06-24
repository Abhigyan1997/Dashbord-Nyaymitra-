"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { User, Bell, Shield, Clock, DollarSign, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { mockLawyer } from "@/lib/mock-data"
import { authUtils } from "@/lib/auth"

export default function LawyerSettingsPage() {
  const [lawyer, setLawyer] = useState(mockLawyer)
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    hourlyRate: 0,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [availability, setAvailability] = useState({
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "09:00", end: "17:00" },
    sunday: { enabled: false, start: "09:00", end: "17:00" },
  })

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailReminders: true,
    smsReminders: true,
    marketingEmails: false,
    clientMessages: true,
  })

  const [paymentSettings, setPaymentSettings] = useState({
    autoWithdraw: true,
    withdrawalDay: "friday",
    minimumBalance: 100,
  })

  useEffect(() => {
    const currentUser = authUtils.getUser()
    if (currentUser) {
      setLawyer(currentUser)
      setProfileData({
        name: currentUser.name,
        email: currentUser.email,
        phone: mockLawyer.phone,
        specialty: mockLawyer.specialty,
        hourlyRate: 150,
      })
    }
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // In production: await lawyerApi.updateProfile(profileData)
      console.log("Profile updated:", profileData)
      const updatedUser = { ...lawyer, ...profileData }
      setLawyer(updatedUser)
      authUtils.setUser(updatedUser)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match")
      return
    }
    setLoading(true)
    try {
      // In production: await lawyerApi.changePassword(passwordData)
      console.log("Password changed")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      console.error("Error changing password:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvailabilityUpdate = async (day: string, field: string, value: any) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof typeof prev], [field]: value },
    }))
    try {
      // In production: await lawyerApi.updateAvailability({ [day]: { [field]: value } })
      console.log("Availability updated:", day, field, value)
    } catch (error) {
      console.error("Error updating availability:", error)
    }
  }

  const handleNotificationUpdate = async (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    try {
      // In production: await lawyerApi.updateNotifications({ [key]: value })
      console.log("Notification updated:", key, value)
    } catch (error) {
      console.error("Error updating notification:", error)
    }
  }

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ]

  return (
    <ProtectedRoute requiredUserType="lawyer">
      <DashboardLayout userType="lawyer" user={lawyer}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Professional Information
                  </CardTitle>
                  <CardDescription>Update your professional details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
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
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input
                          id="specialty"
                          value={profileData.specialty}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, specialty: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={profileData.hourlyRate}
                          onChange={(e) =>
                            setProfileData((prev) => ({ ...prev, hourlyRate: Number.parseInt(e.target.value) }))
                          }
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Working Hours
                  </CardTitle>
                  <CardDescription>Set your availability for consultations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {days.map((day) => (
                    <div key={day.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={availability[day.key as keyof typeof availability].enabled}
                          onCheckedChange={(checked) => handleAvailabilityUpdate(day.key, "enabled", checked)}
                        />
                        <Label className="w-20">{day.label}</Label>
                      </div>
                      {availability[day.key as keyof typeof availability].enabled && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={availability[day.key as keyof typeof availability].start}
                            onChange={(e) => handleAvailabilityUpdate(day.key, "start", e.target.value)}
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={availability[day.key as keyof typeof availability].end}
                            onChange={(e) => handleAvailabilityUpdate(day.key, "end", e.target.value)}
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email notifications for new bookings</Label>
                      <p className="text-sm text-muted-foreground">Get notified when clients book consultations</p>
                    </div>
                    <Switch
                      checked={notifications.emailBookings}
                      onCheckedChange={(checked) => handleNotificationUpdate("emailBookings", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email reminders</Label>
                      <p className="text-sm text-muted-foreground">Get reminder emails before consultations</p>
                    </div>
                    <Switch
                      checked={notifications.emailReminders}
                      onCheckedChange={(checked) => handleNotificationUpdate("emailReminders", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS reminders</Label>
                      <p className="text-sm text-muted-foreground">Get text message reminders before consultations</p>
                    </div>
                    <Switch
                      checked={notifications.smsReminders}
                      onCheckedChange={(checked) => handleNotificationUpdate("smsReminders", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Client messages</Label>
                      <p className="text-sm text-muted-foreground">Get notified when clients send you messages</p>
                    </div>
                    <Switch
                      checked={notifications.clientMessages}
                      onCheckedChange={(checked) => handleNotificationUpdate("clientMessages", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing emails</Label>
                      <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => handleNotificationUpdate("marketingEmails", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
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
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
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
                          onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
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
                        onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Payment Settings
                  </CardTitle>
                  <CardDescription>Manage your payment preferences and bank details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Automatic withdrawals</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically transfer earnings to your bank account
                      </p>
                    </div>
                    <Switch
                      checked={paymentSettings.autoWithdraw}
                      onCheckedChange={(checked) => setPaymentSettings((prev) => ({ ...prev, autoWithdraw: checked }))}
                    />
                  </div>

                  {paymentSettings.autoWithdraw && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Withdrawal day</Label>
                          <Select
                            value={paymentSettings.withdrawalDay}
                            onValueChange={(value) => setPaymentSettings((prev) => ({ ...prev, withdrawalDay: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monday">Monday</SelectItem>
                              <SelectItem value="tuesday">Tuesday</SelectItem>
                              <SelectItem value="wednesday">Wednesday</SelectItem>
                              <SelectItem value="thursday">Thursday</SelectItem>
                              <SelectItem value="friday">Friday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum balance ($)</Label>
                          <Input
                            type="number"
                            value={paymentSettings.minimumBalance}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                minimumBalance: Number.parseInt(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bank Account</CardTitle>
                  <CardDescription>Your linked bank account for payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Chase Bank</p>
                        <p className="text-sm text-muted-foreground">•••• •••• •••• 1234</p>
                        <p className="text-sm text-muted-foreground">Checking Account</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline">Add Bank Account</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
