// VAPID Keys API - Web Push 공개키 제공
// 2025-09-03 04:35 KST - Web Push 구현

import { NextResponse } from "next/server"

// VAPID keys (실제 운영환경에서는 환경변수로 관리)
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
    "BKY2YXzaEiApOt9vdivE6GDPnJqZ8-JXn1CVLXeuvqzDqh3vC0D7vRlLHG4oQD3qM3lnRNqPqBxEKE9rFJN9xYI",
  privateKey: process.env.VAPID_PRIVATE_KEY || 
    "YOUR_PRIVATE_KEY_HERE" // 서버에서만 사용
}

export async function GET() {
  return NextResponse.json({
    publicKey: vapidKeys.publicKey
  })
}