import axios from "axios"

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "https://nyaymitra-backend-production.up.railway.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth API endpoints
export const authApi = {
  login: (credentials: { email: string; password: string; userType: string }) =>
    api.post("/auth/login", credentials),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data: any) => api.patch("/auth/profile", data),
}

// Common API endpoints
export const commonApi = {
  uploadImage: (file: FormData) =>
    api.post("/upload/image", file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
}



// User API endpoints
export const userApi = {
  getProfile: () => authApi.getProfile(),
  getAllBookings: (userId: string, page = 1, limit = 5) =>
    api.get(`/booking/allOrders/${userId}`, {
      params: { page, limit },
    }),
  getBookingById: (bookingId: string) => api.get(`/booking/${bookingId}`),
  cancelBooking: (bookingId: string) => api.patch(`/booking/${bookingId}/cancel`),
  updateProfile: (data: any) => api.patch("/auth/profile", data),
  getAllLawyers: () => api.get("/lawyer/all"),
  getLawyerDetails: (lawyerId: string) => api.get(`/lawyer/details/${lawyerId}`),
  bookLawyer: (bookingData: any) => api.post("/booking/book", bookingData),
  getLawyerAvailability: (lawyerId: string) => api.get(`/lawyer/${lawyerId}`),
  checkSlotAvailability: (lawyerId: string, date: string) => api.get(`/lawyer/${lawyerId}/check`, { params: { date } }),
  bookConsultation: (bookingData: any) => api.post("/booking/book", bookingData),
  createPaymentOrder: (orderData: any) => api.post("/payment/create-order", orderData),
  verifyPayment: (paymentData: any) => api.post("/payment/verify", paymentData),
  getUserDetails: (userId: string) => api.get(`/auth/user/${userId}`),
  getUpcomingConsultations: (userId: string) => api.get(`/auth/upcoming/${userId}`)
}

// Lawyer API endpoints
export const lawyerApi = {
  getProfile: () => authApi.getProfile(),
  getAllBookings: (lawyerId: string, page = 1, limit = 10) =>
    api.get(`/booking/lawyer_allorders/${lawyerId}?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }),
  getBookingById: (bookingId: string) => api.get(`/booking/${bookingId}`),
  getStats: () => api.get("/lawyer/stats"),
  completeConsultation: (bookingId: string) => api.patch(`/lawyer/${bookingId}/complete`),
  updateProfile: (data: any) => api.put("/auth/edit_lawyer", data),
  getReviews: (lawyerId: string) => api.get(`/lawyer/reviews/${lawyerId}`),
  getLawyerAvailability: (lawyerId: string) => api.get(`/lawyer/${lawyerId}`),
  getEarnings: (lawyerId: string) => api.get(`/lawyer/earnings/${lawyerId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  }),
  getUpcomingConsultations: (lawyerId: string) => api.get(`/lawyer/upcoming-consultations/${lawyerId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data),
  uploadVerificationDocument: (formData: FormData) => axios.post('/lawyer/verification/documents', formData),
  submitVerification: () => axios.post('/lawyer/verification/submit'),
  resubmitVerification: () => axios.post('/lawyer/verification/resubmit'),
  setAvailability: (data: { timeSlots: Array<{ day: string; slots: string[] }> }) =>
    api.put('/lawyer/availablity', data),
}



export default api