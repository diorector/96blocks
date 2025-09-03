# Supabase CLI 로그인 방법

터미널 환경 제한으로 인해 수동 로그인이 필요합니다.

## 방법 1: Access Token 사용 (권장)

1. **Supabase Dashboard 접속**
   - https://app.supabase.com/account/tokens

2. **Personal Access Token 생성**
   - "Generate new token" 클릭
   - 토큰 이름 입력 (예: "time-planner-cli")
   - 생성된 토큰 복사

3. **토큰으로 로그인**
   ```bash
   npx supabase login --token YOUR_ACCESS_TOKEN
   ```

4. **또는 환경변수 설정**
   ```bash
   set SUPABASE_ACCESS_TOKEN=YOUR_ACCESS_TOKEN
   npx supabase functions deploy push-notifications
   ```

## 방법 2: 브라우저 로그인

1. **Windows Terminal / PowerShell 열기**
   ```bash
   npx supabase login
   ```

2. **브라우저에서 로그인**
   - 자동으로 브라우저가 열림
   - Supabase 계정으로 로그인
   - 성공 메시지 확인

## 프로젝트 연결

로그인 후:
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

프로젝트 REF 확인:
- Supabase Dashboard → Settings → General → Reference ID

## Edge Function 배포

```bash
npx supabase functions deploy push-notifications
```

## 트러블슈팅

### "Cannot use automatic login flow"
- Windows Terminal 또는 PowerShell 사용
- 또는 Access Token 방식 사용

### "Project ref not found"
- Dashboard에서 정확한 Reference ID 확인
- 형식: xxxxxxxxxxxxx (알파벳+숫자 조합)