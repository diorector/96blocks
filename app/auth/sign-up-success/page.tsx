import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">이메일 확인</CardTitle>
            <CardDescription>회원가입이 완료되었습니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">이메일로 전송된 확인 링크를 클릭하여 계정을 활성화하세요.</p>
              <div className="text-center">
                <Link href="/auth/login" className="text-sm underline underline-offset-4">
                  로그인 페이지로 돌아가기
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
