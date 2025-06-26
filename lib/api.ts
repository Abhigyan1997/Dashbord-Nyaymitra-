import axios from "axios"

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
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
}

// Lawyer API endpoints
export const lawyerApi = {
  getProfile: () => authApi.getProfile(),
  getAllBookings: (lawyerId: string) => api.get(`/booking/lawyer_allorders/${lawyerId}`),
  getBookingById: (bookingId: string) => api.get(`/booking/${bookingId}`),
  getStats: () => api.get("/lawyer/stats"),
  completeConsultation: (consultationId: string) => api.patch(`/booking/${consultationId}/complete`),
  updateProfile: (data: any) => api.patch("/auth/profile", data),
  getReviews: (lawyerId: string) => api.get(`/lawyer/reviews/${lawyerId}`),
  getLawyerAvailability: (lawyerId: string) => api.get(`/lawyer/${lawyerId}`),
}



export default api