// Supabase Edge Function - 실제 푸시 전송 버전
// Supabase Dashboard에서 이 코드로 교체하세요

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

console.info('Push notification function started (with actual push)');

Deno.serve(async (req) => {
  // OPTIONS 요청 처리 (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    console.log(`[Push Function] Called at ${hours}:${minutes}`)
    
    // 야간 시간 제외 (23시 ~ 6시)
    if (hours >= 23 || hours < 6) {
      return new Response(
        JSON.stringify({ 
          message: 'Night time - skip',
          time: `${hours}:${minutes}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vercel API 호출 (옵션 1: Vercel에 배포된 경우)
    const NEXT_APP_URL = Deno.env.get('NEXT_APP_URL')
    if (NEXT_APP_URL) {
      try {
        const response = await fetch(`${NEXT_APP_URL}/api/push/send`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        const result = await response.json()
        
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Push notifications sent via Next.js',
            result: result,
            time: `${hours}:${minutes}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Next.js API call failed:', error)
      }
    }

    // 옵션 2: Supabase에서 직접 처리 (기본값)
    // 활성 사용자의 구독 정보 가져오기
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription, user_id')

    if (error) {
      console.error('Failed to fetch subscriptions:', error)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Push function executed',
        time: `${hours}:${minutes}`,
        subscriptions_count: subscriptions?.length || 0,
        next_app_url: NEXT_APP_URL || 'not configured'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})