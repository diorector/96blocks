// Web Push 구독 API
// 2025-09-03 04:37 KST - 푸시 알림 구독 처리

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json()
    
    if (!subscription || !userId) {
      return NextResponse.json(
        { error: "Missing subscription or userId" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // 구독 정보를 데이터베이스에 저장
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: userId,
        subscription: subscription,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      })

    if (error) {
      console.error("Failed to save subscription:", error)
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}