// Supabase Edge Function - 푸시 알림 전송
// 2025-09-03 06:45 KST - Next.js API 라우트 호출 방식

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

    // Next.js API 라우트 호출하여 실제 푸시 전송
    // 프로덕션 URL로 변경 필요
    const NEXT_APP_URL = Deno.env.get('NEXT_APP_URL') || 'https://your-app.vercel.app'
    
    const response = await fetch(`${NEXT_APP_URL}/api/push/send`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Push notifications sent',
        result: result,
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