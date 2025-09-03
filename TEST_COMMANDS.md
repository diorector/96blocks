# 테스트 명령어

## 1. Supabase Edge Function 테스트

### 브라우저 콘솔에서 실행:

```javascript
// 1. 먼저 Supabase Dashboard에서 anon key 복사
// Settings → API → Project API keys → anon public

// 2. 아래 코드에서 YOUR_ANON_KEY를 실제 키로 교체
fetch('https://griwzgyvkwgrovccrxbn.supabase.co/functions/v1/push-notifications', {
  method: 'POST',  // POST 메서드 사용
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',  // 실제 anon key로 교체
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err))
```

### 예시 (실제 키 형태):
```javascript
fetch('https://griwzgyvkwgrovccrxbn.supabase.co/functions/v1/push-notifications', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // 긴 문자열
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
})
.then(res => res.json())  
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err))
```

## 2. 예상 응답

### 주간 (06:00 ~ 23:00):
```json
{
  "success": true,
  "message": "Push notifications sent",
  "result": {...},
  "time": "14:30"
}
```

### 야간 (23:00 ~ 06:00):
```json
{
  "message": "Night time - skip",
  "time": "23:45"
}
```

## 3. 로컬 앱에서 푸시 알림 테스트

1. **앱 접속**: http://localhost:3000
2. **로그인**: Supabase Auth
3. **알림 탭**: 상단 탭에서 "🔔 알림" 클릭
4. **푸시 알림 토글**: ON으로 변경
5. **브라우저 권한**: "허용" 클릭
6. **테스트 알림**: 2초 후 자동으로 테스트 알림 발송

## 4. Service Worker 확인

브라우저 개발자도구:
1. F12 → Application 탭
2. Service Workers 섹션
3. "sw.js" 등록 확인
4. Push 이벤트 로그 확인

## 5. GitHub Actions 수동 실행

1. GitHub Repository → Actions 탭
2. "Supabase Push Notifications" workflow
3. "Run workflow" 버튼 클릭
4. 로그에서 실행 결과 확인

## 트러블슈팅

### "Failed to fetch" 오류:
- POST 메서드 사용 확인
- Authorization 헤더에 Bearer 포함 확인
- anon key가 정확한지 확인

### "403 Forbidden":
- anon key가 올바른지 확인
- Supabase Dashboard에서 Edge Function이 배포되었는지 확인

### 푸시 알림이 안 옴:
- 브라우저 알림 권한 확인
- Service Worker 등록 확인
- VAPID 키 설정 확인