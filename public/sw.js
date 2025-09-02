// Service Worker for 15분 플래너
// 2025-09-03 04:15 KST - iOS 백그라운드 알림 지원

const CACHE_NAME = "time-planner-v2"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"]

// 알림 타이머 관리
let notificationTimers = new Map()

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
  self.skipWaiting()
})

// Activate event  
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    }),
  )
})

// 알림 표시
function showNotification() {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  
  return self.registration.showNotification('15분 플래너 ⏰', {
    body: `${hours}:${minutes} - 시간을 기록해주세요!`,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'time-reminder',
    requireInteraction: true, // iOS에서 중요
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      time: new Date().toISOString()
    }
  })
}

// 다음 알림 시간 계산
function getNextNotificationDelay() {
  const now = new Date()
  const minutes = now.getMinutes()
  
  let targetMinutes
  if (minutes < 15) targetMinutes = 15
  else if (minutes < 30) targetMinutes = 30
  else if (minutes < 45) targetMinutes = 45
  else targetMinutes = 60
  
  const nextTime = new Date(now)
  if (targetMinutes === 60) {
    nextTime.setHours(nextTime.getHours() + 1)
    nextTime.setMinutes(0)
  } else {
    nextTime.setMinutes(targetMinutes)
  }
  nextTime.setSeconds(0)
  nextTime.setMilliseconds(0)
  
  return nextTime.getTime() - now.getTime()
}

// 알림 스케줄링
function scheduleNextNotification() {
  const delay = getNextNotificationDelay()
  console.log(`[SW] 다음 알림까지 ${Math.round(delay/1000)}초`)
  
  // 기존 타이머 제거
  if (notificationTimers.has('main')) {
    clearTimeout(notificationTimers.get('main'))
  }
  
  // 새 타이머 설정
  const timerId = setTimeout(() => {
    showNotification().then(() => {
      scheduleNextNotification() // 재귀적으로 다음 알림 스케줄
    })
  }, delay)
  
  notificationTimers.set('main', timerId)
}

// 메시지 수신
self.addEventListener('message', (event) => {
  console.log('[SW] 메시지 수신:', event.data)
  
  if (event.data.type === 'START_NOTIFICATIONS') {
    scheduleNextNotification()
    event.ports[0].postMessage({ success: true })
  } else if (event.data.type === 'STOP_NOTIFICATIONS') {
    if (notificationTimers.has('main')) {
      clearTimeout(notificationTimers.get('main'))
      notificationTimers.delete('main')
    }
    event.ports[0].postMessage({ success: true })
  } else if (event.data.type === 'TEST_NOTIFICATION') {
    showNotification()
    event.ports[0].postMessage({ success: true })
  }
})

// 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/')
      }
    })
  )
})
