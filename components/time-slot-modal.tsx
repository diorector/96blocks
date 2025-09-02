"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

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
    } catch (error) {
      console.error("Error deleting time slot:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const conditionLabels = ["매우 안좋음", "꽤 안좋음", "약간 안좋음", "중립", "약간 좋음", "꽤 좋음", "매우 좋음"]

  if (!slot) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{format(new Date(slot.slot_time), "HH:mm")} 슬롯</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity">활동 내용</Label>
            <Textarea
              id="activity"
              placeholder="지난 15분 동안 무엇을 했나요?"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>컨디션 (1-7)</Label>
            <div className="grid grid-cols-7 gap-1">
              {conditionLabels.map((label, index) => (
                <Button
                  key={index}
                  variant={conditionScore === index + 1 ? "default" : "outline"}
                  size="sm"
                  className="h-12 text-xs p-1"
                  onClick={() => setConditionScore(index + 1)}
                >
                  <div className="text-center">
                    <div className="font-bold">{index + 1}</div>
                    <div className="text-xs leading-tight">{label}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? "저장 중..." : "저장"}
            </Button>

            {slot.id && (
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                삭제
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
