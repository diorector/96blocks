// NotificationAlternatives - 저전력 모드 대안
// 2025-09-03 04:30 KST - 로컬 알림 및 대안 구현

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Smartphone, Calendar, Volume2 } from "lucide-react"

export function NotificationAlternatives() {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [vibrationEnabled, setVibrationEnabled] = useState(false)
  
  // 1. 페이지가 열려있을 때 소리/진동 알림
  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZlzoMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZl0AMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZl0AMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZl0AMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZl0AMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZl0AMG2G+8OScTgwOSKzn77hZFAg+mdn1nmUcBziS1/LNeSsFJHfH8N+RQAoUXrTp66hVFApGnt/yvmwhBSh+v+zZl0A=')
    audio.play().catch(e => console.log('소리 재생 실패:', e))
  }
  
  const triggerVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }
  
  // 2. 캘린더 알림 설정 안내
  const createCalendarEvent = () => {
    const now = new Date()
    const event = {
      title: '15분 시간 기록',
      start: now.toISOString(),
      duration: 'PT15M',
      description: '시간을 기록해주세요',
      location: window.location.href,
    }
    
    // Google Calendar URL
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(now.getTime() + 15 * 60000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&recur=RRULE:FREQ=HOURLY;INTERVAL=1`
    
    window.open(googleUrl, '_blank')
  }
  
  // 3. 앱이 포그라운드일 때 인앱 알림
  useEffect(() => {
    if (!soundEnabled && !vibrationEnabled) return
    
    const checkTime = () => {
      const now = new Date()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()
      
      // 15, 30, 45, 0분에 알림
      if ([0, 15, 30, 45].includes(minutes) && seconds === 0) {
        if (soundEnabled) playNotificationSound()
        if (vibrationEnabled) triggerVibration()
        
        // 화면에 시각적 알림 표시
        showVisualAlert()
      }
    }
    
    const interval = setInterval(checkTime, 1000)
    return () => clearInterval(interval)
  }, [soundEnabled, vibrationEnabled])
  
  const showVisualAlert = () => {
    // 임시 알림 배너 표시
    const banner = document.createElement('div')
    banner.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce'
    banner.textContent = '⏰ 시간 기록 시간입니다!'
    document.body.appendChild(banner)
    
    setTimeout(() => {
      banner.remove()
    }, 5000)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          저전력 모드 대안
        </CardTitle>
        <CardDescription>
          저전력 모드에서도 사용 가능한 알림 방법
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 인앱 알림 */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            앱 실행 중 알림
          </h3>
          <div className="space-y-2 pl-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">소리 알림</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(e) => setVibrationEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">진동 알림</span>
            </label>
          </div>
        </div>
        
        {/* 캘린더 연동 */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            시스템 캘린더 활용
          </h3>
          <Button
            onClick={createCalendarEvent}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Google 캘린더에 반복 일정 추가
          </Button>
          <p className="text-xs text-muted-foreground">
            캘린더 알림은 저전력 모드에서도 작동합니다
          </p>
        </div>
        
        {/* Apple Shortcuts */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            iOS 단축어 활용
          </h3>
          <div className="bg-muted rounded-lg p-3 text-xs space-y-2">
            <p>iOS 단축어 앱에서:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>개인용 자동화 생성</li>
              <li>시간 트리거 설정 (매시 15, 30, 45, 00분)</li>
              <li>알림 보내기 동작 추가</li>
              <li>"실행 전 묻지 않음" 활성화</li>
            </ol>
          </div>
        </div>
        
        {/* 추가 팁 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-xs">
          <p className="font-medium mb-1">💡 추가 팁:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>중요한 시간대만 알림 설정하여 배터리 절약</li>
            <li>Apple Watch 연동 시 손목 탭 알림 가능</li>
            <li>포커스 모드에서 이 앱만 허용 설정</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}