"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TimeSlotModal } from "@/components/time-slot-modal"
import { createClient } from "@/lib/supabase/client"
import { format, addMinutes, startOfDay } from "date-fns"

interface DailySession {
  id: string
  date: string
  start_time: string | null
  end_time: string | null
}

interface TimeSlot {
  id?: string
  slot_time: string
  activity?: string
  condition_score?: number
}

interface TimeSlotGridProps {
  session: DailySession
  userId: string
}

export function TimeSlotGrid({ session, userId }: TimeSlotGridProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    generateTimeSlots()
    loadTimeSlots()
  }, [session])

  const generateTimeSlots = () => {
    const slots: TimeSlot[] = []
    const baseDate = startOfDay(new Date(session.date))

    // Generate 96 slots (24 hours * 4 slots per hour)
    for (let i = 0; i < 96; i++) {
      const slotTime = addMinutes(baseDate, i * 15)
      slots.push({
        slot_time: slotTime.toISOString(),
      })
    }

    setTimeSlots(slots)
  }

  const loadTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("session_id", session.id)
        .order("slot_time")

      if (error) throw error

      // Merge with generated slots
      setTimeSlots((prevSlots) =>
        prevSlots.map((slot) => {
          const existingSlot = data?.find(
            (d) =>
              format(new Date(d.slot_time), "yyyy-MM-dd HH:mm") ===
              format(new Date(slot.slot_time), "yyyy-MM-dd HH:mm"),
          )
          return existingSlot || slot
        }),
      )
    } catch (error) {
      console.error("Error loading time slots:", error)
    }
  }

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setIsModalOpen(true)
  }

  const handleSlotUpdate = (updatedSlot: TimeSlot) => {
    setTimeSlots((prev) =>
      prev.map((slot) =>
        format(new Date(slot.slot_time), "yyyy-MM-dd HH:mm") ===
        format(new Date(updatedSlot.slot_time), "yyyy-MM-dd HH:mm")
          ? updatedSlot
          : slot,
      ),
    )
    setIsModalOpen(false)
    setSelectedSlot(null)
  }

  const getSlotColor = (slot: TimeSlot) => {
    if (!slot.condition_score) return "bg-muted"

    const colors = [
      "bg-red-500", // 1 - 매우 안좋음
      "bg-red-400", // 2 - 꽤 안좋음
      "bg-orange-400", // 3 - 약간 안좋음
      "bg-yellow-400", // 4 - 중립
      "bg-green-400", // 5 - 약간 좋음
      "bg-green-500", // 6 - 꽤 좋음
      "bg-green-600", // 7 - 매우 좋음
    ]

    return colors[slot.condition_score - 1] || "bg-muted"
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">시간 슬롯</h3>

        <div className="grid grid-cols-4 gap-1 max-h-96 overflow-y-auto">
          {timeSlots.map((slot, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className={`h-12 p-1 text-xs flex flex-col justify-center ${getSlotColor(slot)}`}
              onClick={() => handleSlotClick(slot)}
            >
              <div className="font-mono">{format(new Date(slot.slot_time), "HH:mm")}</div>
              {slot.activity && <div className="truncate w-full text-center">{slot.activity.slice(0, 6)}</div>}
            </Button>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="text-xs space-y-1">
              <div className="font-semibold mb-2">컨디션 색상 가이드:</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>매우 안좋음</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span>꽤 안좋음</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded"></div>
                  <span>약간 안좋음</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                  <span>중립</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded"></div>
                  <span>약간 좋음</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>꽤 좋음</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span>매우 좋음</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TimeSlotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slot={selectedSlot}
        sessionId={session.id}
        userId={userId}
        onUpdate={handleSlotUpdate}
      />
    </>
  )
}
