// Push 구독 API - 블로그 방식 적용
// 2025-09-03 06:15 KST - subscription을 JSONB로 저장

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json()
    
    const supabase = await createClient()
    
    // 구독 정보를 JSONB로 저장
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: userId,
        subscription: subscription, // 전체 구독 객체를 JSONB로 저장
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }
}

// 구독 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 })
  }
}