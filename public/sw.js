// Service Worker for background notifications
const CACHE_NAME = "time-planner-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png"]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    }),
  )
})

// Background sync for notifications
self.addEventListener("sync", (event) => {
  if (event.tag === "time-slot-reminder") {
    event.waitUntil(
      // Handle background notification logic here
      console.log("Background sync triggered for time slot reminder"),
    )
  }
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow("/"))
})
