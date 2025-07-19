// components/notifications/NotificationDropdown.tsx
"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export const NotificationDropdown = () => {
    const { notifications, unreadCount, loading } = useNotifications()

    const formatMessage = (message: string) => {
        const dateMatch = message.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
        if (!dateMatch) return message

        const rawDate = new Date(dateMatch[0])
        const formattedDate = rawDate.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        const formattedTime = rawDate.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })

        // Replace ISO string in message with formatted one
        return message.replace(dateMatch[0], `${formattedDate} at ${formattedTime}`)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative text-white hover:bg-white/10 border border-white/10 rounded-full p-2">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-pink-500 border-0">
                            {unreadCount}
                        </Badge>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80 bg-slate-800 text-white border-white/10 max-h-96 overflow-y-auto">
                <DropdownMenuLabel className="text-white">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />

                {loading && <DropdownMenuItem>Loading...</DropdownMenuItem>}

                {!loading && notifications.length === 0 && (
                    <DropdownMenuItem>No notifications</DropdownMenuItem>
                )}

                {!loading &&
                    notifications.map((notif) => (
                        <DropdownMenuItem key={notif._id} asChild>
                            <Link href={notif.link}>
                                <div className="flex flex-col space-y-1">
                                    <span className="text-sm">{formatMessage(notif.message)}</span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(notif.createdAt).toLocaleString("en-IN", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })}
                                    </span>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
