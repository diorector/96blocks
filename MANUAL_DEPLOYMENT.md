# 수동 배포 가이드 - Supabase Edge Functions

접근 권한 문제로 CLI 배포가 불가능한 경우, Supabase Dashboard에서 직접 배포하세요.

## 방법 1: Supabase Dashboard에서 직접 생성

1. **Supabase Dashboard 접속**
   - https://app.supabase.com 로그인
   - 프로젝트 선택

2. **Edge Functions 섹션**
   - 왼쪽 메뉴에서 "Edge Functions" 클릭
   - "Create a new function" 버튼 클릭

3. **Function 생성**
   - Function name: `push-notifications`
   - 아래 코드 복사/붙여넣기:

```typescript
// Supabase Edge Function - 푸시 알림 전송
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
```

4. **환경변수 설정**
   - Function 생성 후, "Secrets" 탭 클릭
   - 추가: `NEXT_APP_URL` = `https://your-vercel-app.vercel.app`

5. **Deploy 클릭**

## 방법 2: 프로젝트 소유자에게 요청

프로젝트 소유자가 아닌 경우:

1. **프로젝트 소유자에게 요청**
   - Edge Function 배포 권한 요청
   - 또는 Organization Member로 추가 요청

2. **권한 레벨**
   - Owner: 모든 권한
   - Administrator: Edge Functions 배포 가능
   - Developer: 읽기 전용

## 크론 설정 (배포 후)

### GitHub Actions 사용 (권장)
Repository Settings → Secrets에 추가:
- `SUPABASE_FUNCTION_URL`: https://fqncnuzepsfkfvehbroo.supabase.co/functions/v1/push-notifications
- `SUPABASE_ANON_KEY`: (Dashboard → Settings → API에서 확인)

### 또는 cron-job.org 사용
- URL: https://fqncnuzepsfkfvehbroo.supabase.co/functions/v1/push-notifications
- 15분마다 실행
- Authorization 헤더 추가

## 테스트

브라우저에서 직접 테스트:
```javascript
fetch('https://fqncnuzepsfkfvehbroo.supabase.co/functions/v1/push-notifications', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(res => res.json())
.then(console.log)
```

## 트러블슈팅

### "403 Forbidden" 오류
- 프로젝트 접근 권한 확인
- Organization 멤버십 확인

### Docker 경고
- Edge Functions는 서버에서 실행되므로 로컬 Docker 불필요

### CORS 오류
- corsHeaders가 제대로 설정되었는지 확인
- Anon Key 사용 확인