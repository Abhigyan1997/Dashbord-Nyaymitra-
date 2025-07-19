// hooks/useNotifications.ts
import { useEffect, useState } from "react"
import api from "@/lib/api" // ✅ This is your pre-configured instance

interface Notification {
    _id: string
    message: string
    isRead: boolean
    link: string
    createdAt: string
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get("/auth/get_notification") // ✅ Authenticated request
                setNotifications(res.data.notifications)
            } catch (err) {
                console.error("Failed to fetch notifications", err)
            } finally {
                setLoading(false)
            }
        }

        fetchNotifications()
    }, [])

    const unreadCount = notifications.filter(n => !n.isRead).length

    return { notifications, unreadCount, loading }
}
