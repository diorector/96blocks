// 디버그 페이지 - iOS 알림 문제 진단
// 2025-09-03 04:25 KST - Service Worker 및 알림 상태 확인

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 50)])
  }

  useEffect(() => {
    checkEnvironment()
  }, [])

  const checkEnvironment = async () => {
    const info: any = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      standalone: (window.navigator as any).standalone || false,
      iOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      safari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
      notificationAPI: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      permissions: 'permissions' in navigator,
    }

    // Check notification permission
    if ('Notification' in window) {
      info.notificationPermission = Notification.permission
    }

    // Check Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        info.swRegistered = !!registration
        info.swScope = registration?.scope
        info.swActive = !!registration?.active
        
        if (registration?.active) {
          info.swState = registration.active.state
        }
      } catch (error) {
        info.swError = error?.toString()
      }
    }

    // Check if running as PWA
    info.isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                 (window.navigator as any).standalone === true

    setDebugInfo(info)
    addLog('환경 정보 로드 완료')
  }

  const testServiceWorker = async () => {
    addLog('Service Worker 테스트 시작...')
    
    if (!('serviceWorker' in navigator)) {
      addLog('❌ Service Worker 미지원')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      addLog('✅ Service Worker ready')
      
      // Send test message
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        addLog(`SW 응답: ${JSON.stringify(event.data)}`)
      }
      
      registration.active?.postMessage(
        { type: 'TEST_NOTIFICATION' },
        [messageChannel.port2]
      )
      
      addLog('📤 테스트 메시지 전송')
    } catch (error) {
      addLog(`❌ SW 오류: ${error}`)
    }
  }

  const requestPermission = async () => {
    addLog('알림 권한 요청...')
    
    try {
      const result = await Notification.requestPermission()
      addLog(`권한 결과: ${result}`)
      checkEnvironment()
    } catch (error) {
      addLog(`❌ 권한 오류: ${error}`)
    }
  }

  const testDirectNotification = () => {
    addLog('직접 알림 테스트...')
    
    if (Notification.permission !== 'granted') {
      addLog('❌ 권한 없음')
      return
    }

    try {
      const notification = new Notification('테스트 알림', {
        body: '직접 생성된 알림입니다',
        icon: '/icon-192x192.png',
        tag: 'direct-test',
      })
      
      notification.onshow = () => addLog('✅ 알림 표시됨')
      notification.onerror = (e) => addLog(`❌ 알림 오류: ${e}`)
      notification.onclose = () => addLog('알림 닫힘')
      
      addLog('알림 객체 생성 완료')
    } catch (error) {
      addLog(`❌ 알림 생성 실패: ${error}`)
    }
  }

  const testBackgroundSchedule = async () => {
    addLog('백그라운드 스케줄 테스트...')
    
    if (!('serviceWorker' in navigator)) {
      addLog('❌ Service Worker 미지원')
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        addLog(`스케줄 응답: ${JSON.stringify(event.data)}`)
      }
      
      registration.active?.postMessage(
        { type: 'START_NOTIFICATIONS' },
        [messageChannel.port2]
      )
      
      addLog('📅 알림 스케줄 시작 요청')
    } catch (error) {
      addLog(`❌ 스케줄 오류: ${error}`)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>iOS 알림 디버그</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 환경 정보 */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">환경 정보:</h3>
            <div className="bg-muted rounded-lg p-3 text-xs font-mono space-y-1">
              <div>iOS: {debugInfo.iOS ? '✅' : '❌'}</div>
              <div>Safari: {debugInfo.safari ? '✅' : '❌'}</div>
              <div>PWA 모드: {debugInfo.isPWA ? '✅' : '❌'}</div>
              <div>Standalone: {debugInfo.standalone ? '✅' : '❌'}</div>
              <div>알림 API: {debugInfo.notificationAPI ? '✅' : '❌'}</div>
              <div>알림 권한: {debugInfo.notificationPermission || '없음'}</div>
              <div>Service Worker: {debugInfo.serviceWorker ? '✅' : '❌'}</div>
              <div>SW 등록: {debugInfo.swRegistered ? '✅' : '❌'}</div>
              <div>SW 활성: {debugInfo.swActive ? '✅' : '❌'}</div>
              <div>SW 상태: {debugInfo.swState || '없음'}</div>
              <div className="text-[10px] break-all opacity-70">
                User Agent: {debugInfo.userAgent}
              </div>
            </div>
          </div>

          {/* 테스트 버튼 */}
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={checkEnvironment} variant="outline" size="sm">
              🔄 상태 새로고침
            </Button>
            <Button onClick={requestPermission} variant="outline" size="sm">
              🔐 권한 요청
            </Button>
            <Button onClick={testDirectNotification} variant="outline" size="sm">
              📬 직접 알림
            </Button>
            <Button onClick={testServiceWorker} variant="outline" size="sm">
              ⚙️ SW 테스트
            </Button>
            <Button onClick={testBackgroundSchedule} variant="outline" size="sm">
              ⏰ 스케줄 시작
            </Button>
            <Button onClick={() => setLogs([])} variant="ghost" size="sm">
              🗑️ 로그 지우기
            </Button>
          </div>

          {/* 로그 */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">실시간 로그:</h3>
            <div className="bg-muted rounded-lg p-3 h-64 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">버튼을 클릭하여 테스트하세요</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="py-0.5 border-b border-border/30 last:border-0">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* iOS 특별 안내 */}
          {debugInfo.iOS && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-xs space-y-2">
              <p className="font-medium">📱 iOS 사용자 안내:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li>Safari에서 "홈 화면에 추가"로 PWA 설치 필수</li>
                <li>설치된 PWA 앱에서 알림 권한 허용</li>
                <li>iOS 16.4+ 필요 (Service Worker 알림)</li>
                <li>백그라운드 새로고침 활성화 확인</li>
                <li>저전력 모드 해제 확인</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}