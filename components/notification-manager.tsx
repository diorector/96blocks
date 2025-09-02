// NotificationManager - Service Worker 연동
// 2025-09-03 04:18 KST - iOS 백그라운드 알림 지원

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
      console.log("현재 알림 권한 상태:", Notification.permission)
      const result = await Notification.requestPermission()
      console.log("권한 요청 결과:", result)
      setPermission(result)
      const granted = result === "granted"
      setNotificationsEnabled(granted)
      onPermissionChange?.(granted)

      if (granted) {
        // Show test notification
        console.log("테스트 알림 전송 시도")
        const notification = new Notification("15분 플래너", {
          body: "알림이 활성화되었습니다!",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          requireInteraction: false,
          tag: "test-notification",
        })
        
        notification.onclick = () => {
          console.log("알림 클릭됨")
          window.focus()
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      alert("알림 권한 요청 중 오류가 발생했습니다: " + error)
    }
  }

  const startNotificationSchedule = useCallback(async () => {
    // Service Worker를 통해 알림 스케줄 시작
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const messageChannel = new MessageChannel()
        
        registration.active?.postMessage(
          { type: 'START_NOTIFICATIONS' },
          [messageChannel.port2]
        )
        
        messageChannel.port1.onmessage = (event) => {
          console.log('Service Worker 응답:', event.data)
        }
        
        console.log('Service Worker 알림 시작')
      } catch (error) {
        console.error('Service Worker 알림 시작 실패:', error)
        // Fallback to regular timer for desktop
        startFallbackSchedule()
      }
    } else {
      // Service Worker 미지원 시 기존 방식
      startFallbackSchedule()
    }
  }, [permission])
  
  const startFallbackSchedule = useCallback(() => {
    if (intervalId) return
    
    const scheduleNextNotification = () => {
      const now = new Date()
      const minutes = now.getMinutes()
      
      let nextMinutes: number
      if (minutes < 15) nextMinutes = 15
      else if (minutes < 30) nextMinutes = 30
      else if (minutes < 45) nextMinutes = 45
      else nextMinutes = 60
      
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
        if (permission === "granted") {
          new Notification("15분 플래너", {
            body: `${nextTime.getHours().toString().padStart(2, "0")}:${nextTime.getMinutes().toString().padStart(2, "0")} 시간 기록을 업데이트하세요!`,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
            tag: "time-slot-reminder",
            requireInteraction: false,
          })
        }
        scheduleNextNotification()
      }, timeUntilNext)
      
      setIntervalId(timeoutId)
    }
    
    scheduleNextNotification()
  }, [permission, intervalId])

  const stopNotificationSchedule = useCallback(async () => {
    // Service Worker 알림 중지
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const messageChannel = new MessageChannel()
        
        registration.active?.postMessage(
          { type: 'STOP_NOTIFICATIONS' },
          [messageChannel.port2]
        )
        
        console.log('Service Worker 알림 중지')
      } catch (error) {
        console.error('Service Worker 알림 중지 실패:', error)
      }
    }
    
    // 기존 타이머도 중지
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

        {/* iOS 저전력 모드 안내 */}
        {permission === "granted" && /iPad|iPhone|iPod/.test(navigator.userAgent) && (
          <div className="text-xs bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
            <p className="font-medium mb-1">📱 iOS 저전력 모드 사용자:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>저전력 모드에서는 백그라운드 알림 제한</li>
              <li>캘린더 알림 또는 단축어 사용 권장</li>
              <li>앱 실행 중에는 소리/진동 알림 가능</li>
            </ul>
          </div>
        )}
        
        {permission === "granted" && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                console.log("테스트 알림 버튼 클릭됨")
                console.log("현재 권한 상태:", Notification.permission)
                
                // Service Worker를 통한 알림 테스트
                if ('serviceWorker' in navigator) {
                  const registration = await navigator.serviceWorker.ready
                  const messageChannel = new MessageChannel()
                  
                  registration.active?.postMessage(
                    { type: 'TEST_NOTIFICATION' },
                    [messageChannel.port2]
                  )
                  
                  messageChannel.port1.onmessage = (event) => {
                    console.log('테스트 알림 전송 완료:', event.data)
                  }
                } else {
                  // Fallback
                  const notification = new Notification("15분 플래너 테스트", {
                    body: "테스트 알림입니다! 알림이 정상적으로 작동합니다.",
                    icon: "/icon-192x192.png",
                    badge: "/icon-192x192.png",
                    requireInteraction: false,
                    tag: "test-button-notification",
                  })
                  
                  notification.onclick = () => {
                    window.focus()
                    notification.close()
                  }
                }
              } catch (error) {
                console.error("테스트 알림 생성 오류:", error)
                alert("알림 생성 중 오류가 발생했습니다: " + error)
              }
            }}
          >
            테스트 알림
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
