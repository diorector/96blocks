// Supabase Edge Function - Push Notifications
// 2025-09-03 05:10 KST - 15분마다 푸시 알림 전송

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// VAPID Keys - Supabase Vault에서 관리
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'your-email@example.com'

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // 야간 시간 제외 (23시 ~ 6시)
    if (hours >= 23 || hours < 6) {
      return new Response(
        JSON.stringify({ 
          message: 'Night time - notifications disabled',
          time: `${hours}:${minutes}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 오늘 날짜의 활성 세션 가져오기
    const today = now.toISOString().split('T')[0]
    const { data: activeSessions, error: sessionsError } = await supabase
      .from('daily_sessions')
      .select('user_id')
      .eq('date', today)
      .not('start_time', 'is', null)
      .is('end_time', null)

    if (sessionsError || !activeSessions?.length) {
      return new Response(
        JSON.stringify({ 
          message: 'No active sessions found',
          count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 사용자들의 푸시 구독 정보 가져오기
    const userIds = activeSessions.map(s => s.user_id)
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', userIds)

    if (subError || !subscriptions?.length) {
      return new Response(
        JSON.stringify({ 
          message: 'No push subscriptions found',
          count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Web Push 페이로드
    const payload = {
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
    }

    // 각 구독에 푸시 전송
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const subscription = sub.subscription as any
        const endpoint = subscription.endpoint
        
        // FCM/APNs 등 푸시 서비스로 전송
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '60',
            'Authorization': `WebPush ${generateVAPIDAuth(endpoint)}`,
          },
          body: JSON.stringify(payload)
        })

        return { success: response.ok, status: response.status }
      } catch (error) {
        console.error('Push send error:', error)
        return { success: false, error: error.message }
      }
    })

    const results = await Promise.allSettled(sendPromises)
    const successCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length

    return new Response(
      JSON.stringify({ 
        success: true,
        sent: successCount,
        total: subscriptions.length,
        time: `${hours}:${minutes}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// VAPID 인증 헤더 생성 (간단한 예시)
function generateVAPIDAuth(endpoint: string): string {
  // 실제 구현에서는 web-push 라이브러리 사용
  return `${VAPID_PUBLIC_KEY}`
}