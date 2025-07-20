"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { User, Bell, Shield, CreditCard, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { mockUser } from "@/lib/mock-data"
import { authUtils } from "@/lib/auth"

export default function UserSettingsPage() {
  const [user, setUser] = useState(mockUser)
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    language: "",
    timezone: "",
    profileImage: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    },
    emergencyContact: {
      name: "",
      relation: "",
      phone: "",
    },
  });




  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailReminders: true,
    smsReminders: false,
    marketingEmails: false,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = authUtils.getToken(); // Assuming you store JWT token
        const res = await fetch("https://nyaymitra-backend.onrender.com/api/v1/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        console.log("Fetched user data:", data);
        setUser(data);

        setProfileData({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          gender: data.gender || "",
          dob: data.dob ? data.dob.slice(0, 10) : "", // format to YYYY-MM-DD
          language: data.language || "",
          timezone: data.timezone || "",
          profileImage: data.profileImage || "",
          address: {
            street: data.address?.street || "",
            city: data.address?.city || "",
            state: data.address?.state || "",
            country: data.address?.country || "",
            pincode: data.address?.pincode || "",
          },
          emergencyContact: {
            name: data.emergencyContact?.name || "",
            relation: data.emergencyContact?.relation || "",
            phone: data.emergencyContact?.phone || "",
          },
        });


        setNotifications({
          emailBookings: data.notificationPreferences?.email ?? true,
          smsReminders: data.notificationPreferences?.sms ?? false,
          marketingEmails: data.notificationPreferences?.whatsapp ?? false,
          emailReminders: true, // default if not in data
        });

      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    fetchProfile();
  }, []);


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = authUtils.getToken();

      const res = await fetch("https://nyaymitra-backend.onrender.com/api/v1/auth/edit_user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          gender: profileData.gender,
          dob: profileData.dob,
          profileImage: profileData.profileImage,
          language: profileData.language,
          timezone: profileData.timezone,
          address: {
            street: profileData.address.street,
            city: profileData.address.city,
            state: profileData.address.state,
            country: profileData.address.country,
            pincode: profileData.address.pincode,
          },
          emergencyContact: {
            name: profileData.emergencyContact.name,
            relation: profileData.emergencyContact.relation,
            phone: profileData.emergencyContact.phone,
          },
          notificationPreferences: {
            email: notifications.emailBookings,
            sms: notifications.smsReminders,
            whatsapp: notifications.marketingEmails,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updated = await res.json();
      setUser(updated);
      authUtils.setUser(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };


  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const token = authUtils.getToken(); // get from localStorage/cookie
      const res = await fetch("https://nyaymitra-backend-production.up.railway.app/api/v1/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      alert("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message || "Failed to change password");
      } else {
        alert("Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };


  const handleNotificationUpdate = async (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    try {
      // In production: await userApi.updateNotifications({ [key]: value })
      console.log("Notification updated:", key, value)
    } catch (error) {
      console.error("Error updating notification:", error)
    }
  }

  return (
    <ProtectedRoute requiredUserType="user">
      <DashboardLayout userType="user" user={user}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        {/* Remove the conditional since we don't have profileImage */}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-semibold flex items-center justify-center">
                          {profileData.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <Input
                          type="url"
                          placeholder="Image URL"
                          value={profileData.profileImage}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, profileImage: e.target.value }))}
                        />
                        <p className="text-sm text-muted-foreground mt-2">JPG, GIF or PNG. 1MB max.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={profileData.fullName} onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={profileData.email} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={profileData.phone} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth</Label>
                        <Input type="date" value={profileData.dob} onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <select
                          className="border rounded px-3 py-2 w-full"
                          value={profileData.gender}
                          onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Input value={profileData.language} onChange={(e) => setProfileData({ ...profileData, language: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Input value={profileData.timezone} onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })} />
                      </div>
                    </div>

                    <Separator />
                    <h3 className="font-semibold">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Street" value={profileData.address.street} onChange={(e) => setProfileData((prev) => ({ ...prev, address: { ...prev.address, street: e.target.value } }))} />
                      <Input placeholder="City" value={profileData.address.city} onChange={(e) => setProfileData((prev) => ({ ...prev, address: { ...prev.address, city: e.target.value } }))} />
                      <Input placeholder="State" value={profileData.address.state} onChange={(e) => setProfileData((prev) => ({ ...prev, address: { ...prev.address, state: e.target.value } }))} />
                      <Input placeholder="Country" value={profileData.address.country} onChange={(e) => setProfileData((prev) => ({ ...prev, address: { ...prev.address, country: e.target.value } }))} />
                      <Input placeholder="Pincode" value={profileData.address.pincode} onChange={(e) => setProfileData((prev) => ({ ...prev, address: { ...prev.address, pincode: e.target.value } }))} />
                    </div>

                    <Separator />
                    <h3 className="font-semibold">Emergency Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.emergencyContact && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Name"
                            value={profileData.emergencyContact.name}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                emergencyContact: { ...prev.emergencyContact, name: e.target.value },
                              }))
                            }
                          />
                          <Input
                            placeholder="Relation"
                            value={profileData.emergencyContact.relation}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                emergencyContact: { ...prev.emergencyContact, relation: e.target.value },
                              }))
                            }
                          />
                          <Input
                            placeholder="Phone"
                            value={profileData.emergencyContact.phone}
                            onChange={(e) =>
                              setProfileData((prev) => ({
                                ...prev,
                                emergencyContact: { ...prev.emergencyContact, phone: e.target.value },
                              }))
                            }
                          />
                        </div>
                      )}

                      <Input placeholder="Relation" value={profileData.emergencyContact.relation} onChange={(e) => setProfileData((prev) => ({ ...prev, emergencyContact: { ...prev.emergencyContact, relation: e.target.value } }))} />
                      <Input placeholder="Phone" value={profileData.emergencyContact.phone} onChange={(e) => setProfileData((prev) => ({ ...prev, emergencyContact: { ...prev.emergencyContact, phone: e.target.value } }))} />
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
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
                      <Label>Email notifications for bookings</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when bookings are confirmed or cancelled
                      </p>
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
                      <p className="text-sm text-muted-foreground">Get reminder emails before your consultations</p>
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

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>Manage your payment methods and billing information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          VISA
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/25</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline">Add Payment Method</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>View your past transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { date: "Jan 15, 2024", description: "Consultation with Sarah Johnson", amount: "$150.00" },
                      { date: "Jan 10, 2024", description: "Consultation with Michael Chen", amount: "$120.00" },
                      { date: "Jan 8, 2024", description: "Consultation with Emily Rodriguez", amount: "$200.00" },
                    ].map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                        <p className="font-medium">{transaction.amount}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
