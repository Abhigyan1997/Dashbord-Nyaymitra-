// app/reset-password/page.tsx
import React, { Suspense } from 'react'
import ResetPasswordPage from './reset-password-form'

export default function ResetPasswordPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <ResetPasswordPage />
        </Suspense>
    )
}
