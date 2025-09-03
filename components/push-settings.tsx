// Push 알림 설정 컴포넌트
// 2025-09-03 06:35 KST - 블로그 방식 적용

"use client"

import { useState, useEffect } from "react"
import { pushManager } from "@/lib/push-notification"
import { Bell, BellOff } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface PushSettingsProps {
  user: User | null
}

export function PushSettings({ user }: PushSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    if (!pushManager.isSupported()) {
      setError("이 브라우저는 푸시 알림을 지원하지 않습니다")
      return
    }

    try {
      const subscription = await pushManager.getSubscription()
      setIsEnabled(!!subscription)
    } catch (err) {
      console.error("Failed to check subscription:", err)
    }
  }

  const togglePush = async () => {
    if (!user) {
      setError("로그인이 필요합니다")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (isEnabled) {
        // 구독 취소
        await pushManager.unsubscribe(user.id)
        setIsEnabled(false)
      } else {
        // 구독 시작
        await pushManager.subscribe(user.id)
        setIsEnabled(true)
        
        // 테스트 알림 전송
        setTimeout(async () => {
          try {
            await pushManager.sendTestNotification(user.id)
          } catch (err) {
            console.error("Test notification failed:", err)
          }
        }, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림 설정 실패")
      console.error("Push toggle failed:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!pushManager.isSupported()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          이 브라우저는 푸시 알림을 지원하지 않습니다
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <Bell className="w-5 h-5 text-blue-500" />
          ) : (
            <BellOff className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">푸시 알림</h3>
            <p className="text-sm text-gray-500">
              15분마다 알림을 받습니다
            </p>
          </div>
        </div>
        
        <button
          onClick={togglePush}
          disabled={isLoading}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${isEnabled ? 'bg-blue-500' : 'bg-gray-200'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isEnabled && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            ✅ 푸시 알림이 활성화되었습니다
          </p>
          <p className="text-xs text-green-600 mt-1">
            브라우저를 닫아도 알림을 받을 수 있습니다
          </p>
        </div>
      )}
    </div>
  )
}