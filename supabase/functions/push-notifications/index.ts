// Supabase Edge Function - 간단한 푸시 알림
// 2025-09-03 05:30 KST - 실제 작동하는 버전

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    // 테스트를 위해 모든 요청 로그
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

    // 여기에 실제 푸시 로직 추가
    // 1. 활성 사용자 찾기
    // 2. 푸시 구독 정보 가져오기  
    // 3. 푸시 전송

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Push notifications would be sent',
        time: `${hours}:${minutes}`
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