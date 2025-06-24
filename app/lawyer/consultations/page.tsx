"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Phone, Video, Search, Filter, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { mockLawyer, mockLawyerConsultations } from "@/lib/mock-data"
import { authUtils } from "@/lib/auth"

export default function LawyerConsultationsPage() {
  const [lawyer, setLawyer] = useState(mockLawyer)
  const [consultations, setConsultations] = useState(mockLawyerConsultations)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const currentUser = authUtils.getUser()
    if (currentUser) {
      setLawyer(currentUser)
    }
    loadConsultations()
  }, [])

  const loadConsultations = async () => {
    setLoading(true)
    try {
      // In production: const response = await lawyerApi.getConsultations()
      setConsultations(mockLawyerConsultations)
    } catch (error) {
      console.error("Error loading consultations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteConsultation = async (consultationId: string) => {
    try {
      // await lawyerApi.completeConsultation(consultationId)
      setConsultations((prev) =>
        prev.map((consultation) =>
          consultation.id === consultationId ? { ...consultation, status: "completed" as const } : consultation,
        ),
      )
    } catch (error) {
      console.error("Error completing consultation:", error)
    }
  }

  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      consultation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consultation.problemDescription.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || consultation.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const upcomingConsultations = filteredConsultations.filter((c) => c.status === "upcoming")
  const completedConsultations = filteredConsultations.filter((c) => c.status === "completed")

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Video Call":
        return <Video className="h-4 w-4" />
      case "Phone Call":
        return <Phone className="h-4 w-4" />
      case "In-Person":
        return <MapPin className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const ConsultationCard = ({ consultation }: { consultation: any }) => (
    <Card key={consultation.id}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{consultation.clientName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold text-lg">{consultation.clientName}</h4>
                <p className="text-sm text-muted-foreground">{consultation.clientEmail}</p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Problem Description:</p>
              <p className="text-sm text-muted-foreground">{consultation.problemDescription}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {consultation.date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {consultation.time} ({consultation.duration})
              </div>
              <div className="flex items-center gap-1">
                {getTypeIcon(consultation.type)}
                {consultation.type}
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{consultation.fee}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:min-w-[160px]">
            {consultation.status === "upcoming" && (
              <>
                <Button size="sm">
                  {consultation.type === "Video Call" && <Video className="mr-2 h-4 w-4" />}
                  {consultation.type === "Phone Call" && <Phone className="mr-2 h-4 w-4" />}
                  {consultation.type === "In-Person" && <MapPin className="mr-2 h-4 w-4" />}
                  Start Session
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCompleteConsultation(consultation.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Complete
                </Button>
                <Button variant="ghost" size="sm">
                  Reschedule
                </Button>
              </>
            )}
            {consultation.status === "completed" && (
              <>
                <Badge className="bg-green-100 text-green-800 justify-center">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </Badge>
                <Button variant="outline" size="sm">
                  View Notes
                </Button>
                <Button variant="ghost" size="sm">
                  Send Invoice
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <ProtectedRoute requiredUserType="lawyer">
      <DashboardLayout userType="lawyer" user={lawyer}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
              <p className="text-muted-foreground">Manage your client consultations</p>
            </div>
            <Button size="lg">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by client name or problem..."
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
            <TabsList>
              <TabsTrigger value="all">All ({filteredConsultations.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingConsultations.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedConsultations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredConsultations.map((consultation) => (
                <ConsultationCard key={consultation.id} consultation={consultation} />
              ))}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingConsultations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No upcoming consultations</h3>
                    <p className="text-muted-foreground">Your scheduled consultations will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingConsultations.map((consultation) => (
                  <ConsultationCard key={consultation.id} consultation={consultation} />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedConsultations.map((consultation) => (
                <ConsultationCard key={consultation.id} consultation={consultation} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
