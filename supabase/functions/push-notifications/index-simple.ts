// Supabase Edge Function - 간단한 버전 (timeout 방지)
// 이 코드를 Supabase Dashboard에 복사하세요

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

console.info('Push notification function started (simple version)');

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
    
    // 즉시 응답 반환 (timeout 방지)
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Push function called successfully',
        time: `${hours}:${minutes}`,
        note: 'Simple version - immediate response'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})