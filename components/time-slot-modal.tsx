// TimeSlotModal - 모바일 최적화 및 UI 개선
// 2025-09-03 03:45 KST - 키보드 겹침 해결 완료, 70vh 높이 제한

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { Clock, Hash } from "lucide-react"

interface TimeSlot {
  id?: string
  slot_time: string
  activity?: string
  condition_score?: number
}

interface TimeSlotModalProps {
  isOpen: boolean
  onClose: () => void
  slot: TimeSlot | null
  sessionId: string
  userId: string
  onUpdate: (slot: TimeSlot) => void
}

export function TimeSlotModal({ isOpen, onClose, slot, sessionId, userId, onUpdate }: TimeSlotModalProps) {
  const [activity, setActivity] = useState("")
  const [conditionScore, setConditionScore] = useState<number>(4)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (slot) {
      setActivity(slot.activity || "")
      setConditionScore(slot.condition_score || 4)
    }
  }, [slot])

  const handleSave = async () => {
    if (!slot) return

    setIsLoading(true)
    try {
      const slotData = {
        user_id: userId,
        session_id: sessionId,
        slot_time: slot.slot_time,
        activity: activity.trim() || null,
        condition_score: conditionScore,
      }

      if (slot.id) {
        // Update existing slot
        const { data, error } = await supabase.from("time_slots").update(slotData).eq("id", slot.id).select().single()

        if (error) throw error
        onUpdate(data)
      } else {
        // Create new slot
        const { data, error } = await supabase.from("time_slots").insert(slotData).select().single()

        if (error) throw error
        onUpdate(data)
      }
      onClose()
    } catch (error) {
      console.error("Error saving time slot:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!slot?.id) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("time_slots").delete().eq("id", slot.id)

      if (error) throw error

      onUpdate({
        slot_time: slot.slot_time,
        activity: undefined,
        condition_score: undefined,
      })
      onClose()
    } catch (error) {
      console.error("Error deleting time slot:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!slot) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            {format(new Date(slot.slot_time), "HH:mm")} 기록
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-8">
          {/* 활동 입력 */}
          <div className="space-y-2">
            <Label htmlFor="activity" className="text-xs text-muted-foreground">
              무엇을 했나요?
            </Label>
            <Textarea
              id="activity"
              placeholder="활동 내용을 입력하세요"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              rows={2}
              className="resize-none text-sm"
              autoFocus
            />
          </div>

          {/* 컨디션 선택 - 간소화 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" />
              컨디션
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((level) => (
                <button
                  key={level}
                  onClick={() => setConditionScore(level)}
                  className={`
                    flex-1 h-10 rounded-sm border text-xs font-medium transition-all
                    ${conditionScore === level 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background border-border hover:bg-accent'
                    }
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              1 (나쁨) ← {conditionScore} → 7 (좋음)
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSave} 
              disabled={isLoading} 
              className="flex-1 h-10"
              size="sm"
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>

            {slot.id && (
              <Button 
                variant="outline" 
                onClick={handleDelete} 
                disabled={isLoading}
                size="sm"
                className="h-10"
              >
                삭제
              </Button>
            )}

            <Button 
              variant="ghost" 
              onClick={onClose}
              size="sm"
              className="h-10"
            >
              취소
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}