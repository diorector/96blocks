// PushNotificationManager - 진짜 푸시 알림
// 2025-09-03 04:45 KST - Web Push API 구현

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellRing, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PushNotificationManagerProps {
  userId: string
  isSessionActive: boolean
}

export function PushNotificationManager({ userId, isSessionActive }: PushNotificationManagerProps) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [supported, setSupported] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkPushSupport()
  }, [])

  const checkPushSupport = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      
      // 현재 구독 상태 확인
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error('Failed to check subscription:', error)
      }
    }
  }

  const subscribeToPush = async () => {
    setIsLoading(true)
    
    try {
      // 1. Service Worker 준비
      const registration = await navigator.serviceWorker.ready
      
      // 2. VAPID 공개키 가져오기
      const response = await fetch('/api/webpush/vapid-keys')
      const { publicKey } = await response.json()
      
      // 3. 푸시 구독
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })
      
      // 4. 서버에 구독 정보 저장
      const saveResponse = await fetch('/api/webpush/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId
        })
      })
      
      if (saveResponse.ok) {
        setIsSubscribed(true)
        toast({
          title: "푸시 알림 활성화",
          description: "이제 백그라운드에서도 알림을 받을 수 있습니다!",
        })
        
        // 스케줄 시작
        startPushSchedule()
      }
    } catch (error) {
      console.error('Failed to subscribe:', error)
      toast({
        title: "구독 실패",
        description: "푸시 알림 설정에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    setIsLoading(true)
    
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        setIsSubscribed(false)
        
        toast({
          title: "푸시 알림 비활성화",
          description: "푸시 알림이 중지되었습니다.",
        })
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startPushSchedule = () => {
    // 서버에서 주기적으로 푸시 전송하도록 설정
    // 실제로는 서버 크론잡이나 백그라운드 작업으로 처리
    console.log('Push schedule would be handled by server')
  }

  const testPush = async () => {
    try {
      const response = await fetch('/api/webpush/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: '테스트 푸시 알림',
          body: '푸시 알림이 정상적으로 작동합니다!'
        })
      })
      
      if (response.ok) {
        toast({
          title: "테스트 전송",
          description: "곧 푸시 알림이 도착합니다.",
        })
      }
    } catch (error) {
      console.error('Failed to send test push:', error)
    }
  }

  // Base64 to Uint8Array 변환
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  if (!supported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            이 브라우저는 푸시 알림을 지원하지 않습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          푸시 알림 (저전력 모드 지원)
        </CardTitle>
        <CardDescription>
          서버 기반 푸시로 저전력 모드에서도 작동
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  설정 중...
                </>
              ) : (
                '푸시 알림 켜기'
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={unsubscribeFromPush}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                푸시 알림 끄기
              </Button>
              <Button
                onClick={testPush}
                variant="secondary"
                size="sm"
              >
                테스트
              </Button>
            </>
          )}
        </div>
        
        {isSubscribed && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-xs">
            <p className="font-medium mb-1">✅ 푸시 알림 활성화됨</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>저전력 모드에서도 작동</li>
              <li>앱이 닫혀있어도 알림 수신</li>
              <li>15분마다 자동 알림</li>
            </ul>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 Web Push 장점:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>iOS/Android 모두 지원</li>
            <li>배터리 모드 무관</li>
            <li>백그라운드 실행 불필요</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}