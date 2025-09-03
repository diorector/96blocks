# GitHub Secrets 설정 값

## 1. SUPABASE_FUNCTION_URL
```
https://griwzgyvkwgrovccrxbn.supabase.co/functions/v1/push-notifications
```

## 2. SUPABASE_ANON_KEY
Supabase Dashboard에서 확인:
1. https://app.supabase.com 접속
2. 프로젝트 선택
3. 왼쪽 메뉴 → Settings → API
4. "Project API keys" 섹션
5. "anon public" 키 복사 (eyJ로 시작하는 긴 문자열)

## GitHub에서 설정하기

1. GitHub Repository 페이지 접속
2. Settings 탭 클릭
3. 왼쪽 메뉴 → Secrets and variables → Actions
4. "New repository secret" 버튼 클릭
5. 각각 추가:
   - Name: `SUPABASE_FUNCTION_URL`
   - Value: `https://fqncnuzepsfkfvehbroo.supabase.co/functions/v1/push-notifications`
   
   - Name: `SUPABASE_ANON_KEY`
   - Value: (Dashboard에서 복사한 anon key)

## 확인 방법

GitHub Actions 탭에서:
1. Actions 탭 클릭
2. "Supabase Push Notifications" workflow
3. "Run workflow" 수동 실행
4. 로그 확인

## 테스트 URL

브라우저에서 직접 테스트:
```javascript
// 브라우저 콘솔에서 실행
fetch('https://griwzgyvkwgrovccrxbn.supabase.co/functions/v1/push-notifications', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE',
    'Content-Type': 'application/json'
  },
  body: '{}'
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err))
```

## 주의사항
- SUPABASE_ANON_KEY는 공개되어도 안전한 키입니다 (RLS 정책으로 보호)
- 하지만 GitHub Secrets에 저장하는 것이 좋습니다
- 15분마다 자동 실행되도록 설정되어 있습니다