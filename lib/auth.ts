import { authApi } from "./api"

interface LoginCredentials {
  email: string
  password: string
  userType: "user" | "lawyer"
}

interface AuthUser {
  id: string
  userId: string
  name: string
  email: string
  userType: "user" | "lawyer"
  profilePhoto?: string
  avatar?: string
  token: string
  phone?: string;        // ✅ Add this
  address?: string;      // ✅ Add this (or make it an object if needed)
  fullName?: string;
}

// Helper function to safely access localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  }
}

// Auth utilities
export const authUtils = {
  setToken: (token: string) => {
    safeLocalStorage.setItem("authToken", token)
  },

  getToken: () => {
    return safeLocalStorage.getItem("authToken")
  },

  removeToken: () => {
    safeLocalStorage.removeItem("authToken")
    safeLocalStorage.removeItem("user")
  },

  setUser: (user: Partial<AuthUser>) => {
    safeLocalStorage.setItem("user", JSON.stringify(user));
  },
  getUser: (): AuthUser | null => {
    const user = safeLocalStorage.getItem("user");
    if (!user) return null;

    const parsedUser = JSON.parse(user);

    // Ensure consistent structure
    return {
      id: parsedUser.id,
      userId: parsedUser.userId,
      name: parsedUser.name || parsedUser.fullName,
      fullName: parsedUser.fullName || parsedUser.name,
      email: parsedUser.email,
      userType: parsedUser.userType,
      profilePhoto: parsedUser.profilePhoto || parsedUser.avatar,
      token: parsedUser.token,
      phone: parsedUser.phone || "",
      address: parsedUser.address || {
        street: "",
        city: "",
        state: "",
        country: "",
        pincode: ""
      }
    };
  },

  isAuthenticated: () => {
    return !!authUtils.getToken()
  },
}

// Real authentication using your API
export const auth = {
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    try {
      const response = await authApi.login({
        email: credentials.email,
        password: credentials.password,
        userType: credentials.userType,
      })

      const { user, token } = response.data

      const authUser: AuthUser = {
        id: user.id || user._id,
        userId: user.userId || user.userID || user.user_id || user.id || user._id,
        name: user.name || user.fullName,
        email: user.email,
        userType: credentials.userType,
        avatar: user.avatar || user.profilePicture,
        token: token,
      }

      return authUser
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed")
    }
  },

  getProfile: async (): Promise<AuthUser> => {
    try {
      const response = await authApi.getProfile()
      const user = response.data.user || response.data

      return {
        id: user.id || user._id,
        userId: user.userId || user.userID || user.user_id || user.id || user._id,
        name: user.name || user.fullName,
        email: user.email,
        userType: user.userType || user.role,
        profilePhoto: user.avatar || user.profilePhoto,
        token: authUtils.getToken() || "",
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch profile")
    }
  }
}