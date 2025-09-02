// 알림 테스트 페이지
// 2025-09-03 03:52 KST - 알림 기능 디버깅용 테스트 페이지

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestNotificationPage() {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev])
  }

  const checkPermission = () => {
    if (!("Notification" in window)) {
      addLog("❌ 브라우저가 알림을 지원하지 않습니다")
      return
    }
    
    const permission = Notification.permission
    addLog(`📋 현재 권한 상태: ${permission}`)
    
    if (permission === "denied") {
      addLog("⚠️ 알림이 차단됨. 브라우저 설정에서 허용 필요")
    } else if (permission === "default") {
      addLog("ℹ️ 알림 권한이 요청되지 않음")
    } else {
      addLog("✅ 알림 권한 허용됨")
    }
  }

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      addLog("❌ 브라우저가 알림을 지원하지 않습니다")
      return
    }

    try {
      addLog("🔄 권한 요청 중...")
      const result = await Notification.requestPermission()
      addLog(`✅ 권한 요청 결과: ${result}`)
    } catch (error) {
      addLog(`❌ 오류: ${error}`)
    }
  }

  const sendTestNotification = () => {
    if (Notification.permission !== "granted") {
      addLog("❌ 알림 권한이 없습니다")
      return
    }

    try {
      addLog("📤 알림 전송 시도...")
      
      const notification = new Notification("테스트 알림", {
        body: `현재 시간: ${new Date().toLocaleTimeString()}`,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "test-" + Date.now(),
        requireInteraction: false,
      })

      notification.onshow = () => {
        addLog("✅ 알림이 표시되었습니다")
      }

      notification.onclick = () => {
        addLog("👆 알림이 클릭되었습니다")
        window.focus()
        notification.close()
      }

      notification.onerror = (error) => {
        addLog(`❌ 알림 오류: ${error}`)
      }

      notification.onclose = () => {
        addLog("🔚 알림이 닫혔습니다")
      }

      addLog("✅ 알림 객체 생성 완료")
    } catch (error) {
      addLog(`❌ 알림 생성 실패: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
    addLog("🧹 로그 초기화됨")
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>알림 기능 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={checkPermission} variant="outline">
              권한 확인
            </Button>
            <Button onClick={requestPermission} variant="outline">
              권한 요청
            </Button>
            <Button onClick={sendTestNotification}>
              테스트 알림 전송
            </Button>
            <Button onClick={clearLogs} variant="ghost">
              로그 초기화
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-sm">디버그 로그:</h3>
            <div className="bg-muted rounded-lg p-3 h-96 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">버튼을 클릭하여 테스트하세요</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="py-1 border-b border-border/50 last:border-0">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 알림이 표시되지 않는 경우:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>브라우저 설정에서 이 사이트의 알림이 허용되어 있는지 확인</li>
              <li>Windows 설정 → 시스템 → 알림에서 브라우저 알림이 켜져있는지 확인</li>
              <li>집중 지원 모드가 꺼져있는지 확인</li>
              <li>브라우저를 완전히 종료 후 재시작</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}