// Push Notification 관리 유틸리티
// 2025-09-03 06:30 KST - 블로그 방식 적용

export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null
  
  // 브라우저 지원 확인
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }

  // 권한 요청
  async requestPermission(): Promise<NotificationPermission> {
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    return permission
  }

  // Service Worker 등록
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported')
    }

    this.registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered:', this.registration)
    return this.registration
  }

  // 구독 상태 확인
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.registerServiceWorker()
    }
    return this.registration!.pushManager.getSubscription()
  }

  // 푸시 구독
  async subscribe(userId: string): Promise<PushSubscription> {
    if (!this.registration) {
      await this.registerServiceWorker()
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    // VAPID 공개 키
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey)

    // 구독 생성
    const subscription = await this.registration!.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    })

    // 서버에 구독 정보 저장
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to save subscription')
    }

    console.log('Push subscription saved:', subscription)
    return subscription
  }

  // 구독 취소
  async unsubscribe(userId: string): Promise<void> {
    const subscription = await this.getSubscription()
    if (!subscription) return

    // 구독 취소
    await subscription.unsubscribe()

    // 서버에서 삭제
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    console.log('Push subscription removed')
  }

  // 테스트 알림 전송
  async sendTestNotification(userId: string): Promise<void> {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title: '테스트 알림 🔔',
        body: '푸시 알림이 정상적으로 작동합니다!'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to send test notification')
    }
  }

  // Base64 URL을 Uint8Array로 변환
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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
}

// 싱글톤 인스턴스
export const pushManager = new PushNotificationManager()