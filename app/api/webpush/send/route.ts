// Web Push 전송 API
// 2025-09-03 04:40 KST - 서버에서 푸시 알림 전송

import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@/lib/supabase/server"

// VAPID 설정
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BKY2YXzaEiApOt9vdivE6GDPnJqZ8-JXn1CVLXeuvqzDqh3vC0D7vRlLHG4oQD3qM3lnRNqPqBxEKE9rFJN9xYI",
  process.env.VAPID_PRIVATE_KEY || "YOUR_PRIVATE_KEY_HERE"
)

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body } = await request.json()
    
    const supabase = await createClient()
    
    // 사용자의 구독 정보 가져오기
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
    
    if (error || !subscriptions?.length) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      )
    }
    
    const payload = JSON.stringify({
      title: title || "15분 플래너",
      body: body || "시간을 기록해주세요!",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      timestamp: Date.now(),
      data: {
        url: "/"
      }
    })
    
    // 모든 구독에 푸시 전송
    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub.subscription, payload)
        .catch(err => console.error("Push failed:", err))
    )
    
    await Promise.all(sendPromises)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send push error:", error)
    return NextResponse.json(
      { error: "Failed to send push" },
      { status: 500 }
    )
  }
}