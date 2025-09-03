// Push 알림 전송 API - 블로그 방식
// 2025-09-03 06:20 KST - web-push 라이브러리로 실제 푸시 전송

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// VAPID 설정 - 빌드 시 환경변수 체크
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'your-email@example.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  // VAPID 키 확인
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ 
      error: "Push notifications not configured (missing VAPID keys)" 
    }, { status: 501 })
  }

  try {
    const { userId, title, body, icon, badge, tag } = await request.json()
    
    const supabase = await createClient()
    
    // 사용자의 구독 정보 가져오기
    const { data: subscription, error } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
      .single()

    if (error || !subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    // 푸시 알림 페이로드
    const payload = JSON.stringify({
      title: title || "15분 시간 기록",
      body: body || "지금 무엇을 하고 계신가요?",
      icon: icon || "/icon-192x192.png",
      badge: badge || "/icon-192x192.png",
      tag: tag || "time-reminder",
      data: {
        url: "/",
        timestamp: Date.now()
      }
    })

    // 푸시 전송
    await webpush.sendNotification(subscription.subscription, payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Push send error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to send push" 
    }, { status: 500 })
  }
}

// 모든 활성 사용자에게 푸시 전송 (크론잡용)
export async function GET(request: NextRequest) {
  // VAPID 키 확인
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ 
      message: "Push notifications not configured - skipping",
      reason: "Missing VAPID keys in environment variables"
    })
  }

  try {
    const now = new Date()
    const hours = now.getHours()
    
    // 야간 시간 제외 (23시 ~ 6시)
    if (hours >= 23 || hours < 6) {
      return NextResponse.json({ 
        message: "Night time - skipped",
        time: now.toISOString()
      })
    }

    const supabase = await createClient()
    
    // 모든 구독자 가져오기
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("subscription, user_id")

    if (error) throw error

    const payload = JSON.stringify({
      title: "⏰ 15분 체크인",
      body: "지금 무엇을 하고 계신가요?",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: "time-reminder",
      data: {
        url: "/",
        timestamp: Date.now()
      }
    })

    // 모든 구독자에게 푸시 전송
    const results = await Promise.allSettled(
      (subscriptions || []).map(sub => 
        webpush.sendNotification(sub.subscription, payload)
      )
    )

    const succeeded = results.filter(r => r.status === "fulfilled").length
    const failed = results.filter(r => r.status === "rejected").length

    return NextResponse.json({ 
      success: true,
      sent: succeeded,
      failed: failed,
      time: now.toISOString()
    })
  } catch (error) {
    console.error("Bulk push error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to send bulk push" 
    }, { status: 500 })
  }
}