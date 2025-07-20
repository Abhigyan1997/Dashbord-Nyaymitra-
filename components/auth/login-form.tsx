"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Scale, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GlassCard } from "@/components/ui/glass-card"
import { GradientText } from "@/components/ui/gradient-text"
import { auth, authUtils } from "@/lib/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function LoginForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "" as "user" | "lawyer" | "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!formData.userType) {
        throw new Error("Please select user type")
      }

      const user = await auth.login(formData as any)

      authUtils.setToken(user.token)
      authUtils.setUser(user)

      // Redirect based on user type
      if (user.userType === "user") {
        router.push("/user/dashboard")
      } else {
        router.push("/lawyer/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setError("Please enter your email");
      return;
    }

    setForgotPasswordLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setForgotPasswordSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-4">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      <GlassCard className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative">
                <Scale className="h-10 w-10 text-blue-400" />
                <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-full" />
              </div>
              <GradientText className="text-3xl font-bold">NyayMitra</GradientText>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userType" className="text-white font-medium">
                I am a
              </Label>
              <Select
                value={formData.userType}
                onValueChange={(value: "user" | "lawyer") => setFormData((prev) => ({ ...prev, userType: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-blue-400/50">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 backdrop-blur-xl border-white/10 text-white">
                  <SelectItem value="user">Client</SelectItem>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-400/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:border-blue-400/50 pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-white/10 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-right">
                <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="link"
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium p-0 h-auto"
                    >
                      Forgot password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-400" />
                        Reset Password
                      </DialogTitle>
                    </DialogHeader>
                    {forgotPasswordSuccess ? (
                      <div className="space-y-4">
                        <Alert className="bg-green-500/10 border-green-500/30 text-green-300">
                          <AlertDescription>
                            Password reset email sent! Please check your inbox.
                          </AlertDescription>
                        </Alert>
                        <Button
                          onClick={() => {
                            setIsForgotPasswordOpen(false)
                            setForgotPasswordSuccess(false)
                          }}
                          className="w-full"
                        >
                          Close
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-slate-400">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <Input
                          type="email"
                          placeholder="Your email address"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                        {error && (
                          <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        <Button
                          onClick={handleForgotPassword}
                          className="w-full"
                          disabled={forgotPasswordLoading}
                        >
                          {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {error && !isForgotPasswordOpen && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?{" "}
                <Link href="https://nyaymitra.tech/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  )
}