// Cron Job for Push Notifications
// 2025-09-03 05:00 KST - Vercel Cron으로 15분마다 푸시 전송

import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { createClient } from "@/lib/supabase/server"

// VAPID 설정
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'your-email@example.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function GET(request: NextRequest) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // 15분 간격 체크 (00, 15, 30, 45분)
    if (minutes % 15 !== 0) {
      return NextResponse.json({ 
        message: 'Not a notification time',
        time: `${hours}:${minutes}`
      })
    }

    // 야간 시간 제외 (23시 ~ 6시)
    if (hours >= 23 || hours < 6) {
      return NextResponse.json({ 
        message: 'Night time - skip notification',
        time: `${hours}:${minutes}`
      })
    }

    const supabase = await createClient()
    
    // 활성 세션이 있는 사용자들의 구독 정보 가져오기
    const { data: activeUsers, error: usersError } = await supabase
      .from('daily_sessions')
      .select('user_id')
      .eq('date', now.toISOString().split('T')[0])
      .not('start_time', 'is', null)
      .is('end_time', null)
    
    if (usersError || !activeUsers?.length) {
      return NextResponse.json({ 
        message: 'No active sessions',
        count: 0
      })
    }

    // 각 사용자의 푸시 구독 정보 가져오기
    const userIds = activeUsers.map(u => u.user_id)
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', userIds)
    
    if (subError || !subscriptions?.length) {
      return NextResponse.json({ 
        message: 'No push subscriptions',
        count: 0
      })
    }

    // 푸시 알림 전송
    const payload = JSON.stringify({
      title: '⏰ 15분 플래너',
      body: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} - 지금 무엇을 하고 있나요?`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: `time-${Date.now()}`,
      data: {
        url: '/',
        time: now.toISOString()
      }
    })

    const sendResults = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification(sub.subscription, payload)
      )
    )

    const successCount = sendResults.filter(r => r.status === 'fulfilled').length
    const failCount = sendResults.filter(r => r.status === 'rejected').length

    console.log(`Push sent: ${successCount} success, ${failCount} failed`)

    return NextResponse.json({ 
      success: true,
      sent: successCount,
      failed: failCount,
      time: `${hours}:${minutes}`
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Failed to send notifications',
      details: error 
    }, { status: 500 })
  }
}

// Vercel Edge Function 설정
export const runtime = 'edge'
export const dynamic = 'force-dynamic'