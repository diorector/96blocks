// Cron 전용 푸시 API - 인증 없이 접근 가능
// 2025-09-03 15:45 KST - Edge Function에서 호출용

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import webpush from "web-push"

// VAPID 설정
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'your-email@example.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    // 간단한 보안 체크
    const body = await request.json()
    const secret = request.headers.get('X-Cron-Secret')
    
    // 비밀 키 확인 (옵션)
    if (secret !== 'your-secret-key-here' && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // VAPID 키 확인
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ 
        message: "Push notifications not configured",
        reason: "Missing VAPID keys"
      })
    }

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

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: "No subscriptions found",
        sent: 0
      })
    }

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
      subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payload)
      )
    )

    const succeeded = results.filter(r => r.status === "fulfilled").length
    const failed = results.filter(r => r.status === "rejected").length

    return NextResponse.json({ 
      success: true,
      message: "Push notifications sent",
      sent: succeeded,
      failed: failed,
      time: now.toISOString(),
      source: body.source || 'unknown'
    })
  } catch (error) {
    console.error("Cron push error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to send push" 
    }, { status: 500 })
  }
}