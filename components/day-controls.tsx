"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

interface DailySession {
  id: string
  date: string
  start_time: string | null
  end_time: string | null
}

interface DayControlsProps {
  session: DailySession | null
  onSessionUpdate: (session: DailySession) => void
  userId: string
  today: string
}

export function DayControls({ session, onSessionUpdate, userId, today }: DayControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleStartDay = async () => {
    setIsLoading(true)
    try {
      const now = new Date().toISOString()

      if (session) {
        // Update existing session
        const { data, error } = await supabase
          .from("daily_sessions")
          .update({ start_time: now })
          .eq("id", session.id)
          .select()
          .single()

        if (error) throw error
        onSessionUpdate(data)
      } else {
        // Create new session
        const { data, error } = await supabase
          .from("daily_sessions")
          .insert({
            user_id: userId,
            date: today,
            start_time: now,
          })
          .select()
          .single()

        if (error) throw error
        onSessionUpdate(data)
      }
    } catch (error) {
      console.error("Error starting day:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndDay = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("daily_sessions")
        .update({ end_time: now })
        .eq("id", session.id)
        .select()
        .single()

      if (error) throw error
      onSessionUpdate(data)
    } catch (error) {
      console.error("Error ending day:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const hasStarted = session?.start_time
  const hasEnded = session?.end_time

  return (
    <div className="flex gap-2">
      {!hasStarted && (
        <Button onClick={handleStartDay} disabled={isLoading} className="flex-1">
          {isLoading ? "시작 중..." : "하루 시작"}
        </Button>
      )}

      {hasStarted && !hasEnded && (
        <Button onClick={handleEndDay} disabled={isLoading} variant="destructive" className="flex-1">
          {isLoading ? "종료 중..." : "하루 끝"}
        </Button>
      )}

      {hasStarted && (
        <div className="flex-1 text-sm text-muted-foreground">
          시작: {format(new Date(session!.start_time!), "HH:mm")}
          {hasEnded && <span className="block">종료: {format(new Date(session!.end_time!), "HH:mm")}</span>}
        </div>
      )}
    </div>
  )
}
