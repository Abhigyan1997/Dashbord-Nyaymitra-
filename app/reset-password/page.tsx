"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GlassCard } from "@/components/ui/glass-card"
import { GradientText } from "@/components/ui/gradient-text"

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError("Invalid reset link - missing token");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await axios.patch(
                'http://localhost:5000/api/v1/auth/reset-password',
                {
                    token,
                    password
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            setSuccess(true);
            setTimeout(() => router.push("/auth/login"), 2000);
        } catch (err: any) {
            // Axios wraps the error response in err.response
            const errorMessage = err.response?.data?.message || "Failed to reset password";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <GlassCard className="w-full max-w-md">
                    <div className="p-8 text-center">
                        <Alert variant="destructive">
                            <AlertDescription>
                                Invalid password reset link. Please request a new reset link.
                            </AlertDescription>
                        </Alert>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            className="mt-4"
                        >
                            Back to Login
                        </Button>
                    </div>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-4">
            <GlassCard className="w-full max-w-md">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <GradientText className="text-3xl font-bold">Reset Password</GradientText>
                        </div>
                        <p className="text-slate-400">Enter your new password</p>
                    </div>

                    {success ? (
                        <Alert className="bg-green-500/10 border-green-500/30 text-green-300 mb-4">
                            <AlertDescription>
                                Password reset successfully! Redirecting to login...
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-white font-medium">
                                    New Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-white font-medium">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    required
                                />
                            </div>

                            {error && (
                                <Alert className="bg-red-500/10 border-red-500/30 text-red-300">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                                disabled={loading}
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </form>
                    )}
                </div>
            </GlassCard>
        </div>
    )
}