"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, BellOff } from "lucide-react"

interface NotificationManagerProps {
  isSessionActive: boolean
  onPermissionChange?: (granted: boolean) => void
}

export function NotificationManager({ isSessionActive, onPermissionChange }: NotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check current permission status
    if ("Notification" in window) {
      setPermission(Notification.permission)
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }, [])

  useEffect(() => {
    // Start or stop notifications based on session status and permission
    if (isSessionActive && notificationsEnabled && permission === "granted") {
      startNotificationSchedule()
    } else {
      stopNotificationSchedule()
    }

    return () => stopNotificationSchedule()
  }, [isSessionActive, notificationsEnabled, permission])

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("이 브라우저는 알림을 지원하지 않습니다.")
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      const granted = result === "granted"
      setNotificationsEnabled(granted)
      onPermissionChange?.(granted)

      if (granted) {
        // Show test notification
        new Notification("15분 플래너", {
          body: "알림이 활성화되었습니다!",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
  }

  const startNotificationSchedule = useCallback(() => {
    if (intervalId) return // Already running

    const scheduleNextNotification = () => {
      const now = new Date()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()

      // Calculate next notification time (15, 30, 45, or 0 minutes)
      let nextMinutes: number
      if (minutes < 15) nextMinutes = 15
      else if (minutes < 30) nextMinutes = 30
      else if (minutes < 45) nextMinutes = 45
      else nextMinutes = 60 // Next hour

      const nextTime = new Date(now)
      if (nextMinutes === 60) {
        nextTime.setHours(nextTime.getHours() + 1)
        nextTime.setMinutes(0)
      } else {
        nextTime.setMinutes(nextMinutes)
      }
      nextTime.setSeconds(0)
      nextTime.setMilliseconds(0)

      const timeUntilNext = nextTime.getTime() - now.getTime()

      const timeoutId = setTimeout(() => {
        // Show notification
        if (permission === "granted") {
          new Notification("15분 플래너", {
            body: `${nextTime.getHours().toString().padStart(2, "0")}:${nextTime.getMinutes().toString().padStart(2, "0")} 시간 기록을 업데이트하세요!`,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
            tag: "time-slot-reminder",
            requireInteraction: false,
          })
        }

        // Schedule next notification
        scheduleNextNotification()
      }, timeUntilNext)

      setIntervalId(timeoutId)
    }

    scheduleNextNotification()
  }, [permission, intervalId])

  const stopNotificationSchedule = useCallback(() => {
    if (intervalId) {
      clearTimeout(intervalId)
      setIntervalId(null)
    }
  }, [intervalId])

  const toggleNotifications = () => {
    if (permission !== "granted") {
      requestPermission()
    } else {
      setNotificationsEnabled(!notificationsEnabled)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          알림 설정
        </CardTitle>
        <CardDescription>15분마다 시간 기록 알림을 받으세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications" className="text-sm font-medium">
            15분 간격 알림
          </Label>
          <Switch
            id="notifications"
            checked={notificationsEnabled && permission === "granted"}
            onCheckedChange={toggleNotifications}
          />
        </div>

        {permission === "default" && (
          <div className="text-sm text-muted-foreground">
            <p>알림을 받으려면 브라우저 권한을 허용해주세요.</p>
          </div>
        )}

        {permission === "denied" && (
          <div className="text-sm text-destructive">
            <p>알림이 차단되었습니다. 브라우저 설정에서 알림을 허용해주세요.</p>
          </div>
        )}

        {permission === "granted" && (
          <div className="text-sm text-muted-foreground">
            <p>
              {isSessionActive
                ? notificationsEnabled
                  ? "매 시간 15, 30, 45, 00분에 알림을 받습니다."
                  : "알림이 비활성화되었습니다."
                : "하루를 시작하면 알림이 활성화됩니다."}
            </p>
          </div>
        )}

        {permission === "granted" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              new Notification("15분 플래너", {
                body: "테스트 알림입니다!",
                icon: "/icon-192x192.png",
                badge: "/icon-192x192.png",
              })
            }}
          >
            테스트 알림
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
