// 미들웨어 - PWA 파일 제외 추가
// 2025-09-03 03:02 KST - 서비스 워커와 manifest 파일 제외

import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
