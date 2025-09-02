// TimeSlotGrid - 현재 시간 슬롯 하이라이트 기능
// 2025-09-03 03:35 KST - 현재 시간 표시 추가

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TimeSlotModal } from "@/components/time-slot-modal"
import { createClient } from "@/lib/supabase/client"
import { format, addMinutes, startOfDay, isToday } from "date-fns"

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
  const [currentTime, setCurrentTime] = useState(new Date())
  const supabase = createClient()
  
  // 현재 시간 업데이트 (1분마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // 1분마다 업데이트
    
    return () => clearInterval(timer)
  }, [])

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
    if (!slot.condition_score) return ""

    const colors = [
      "bg-gray-100", // 1
      "bg-gray-200", // 2
      "bg-gray-300", // 3
      "bg-gray-400", // 4
      "bg-gray-500 text-white", // 5
      "bg-gray-700 text-white", // 6
      "bg-gray-900 text-white", // 7
    ]

    return colors[slot.condition_score - 1] || ""
  }
  
  // 현재 시간이 속한 슬롯인지 확인
  const isCurrentTimeSlot = (slot: TimeSlot) => {
    // 오늘 날짜인 경우에만 현재 시간 체크
    if (!isToday(new Date(session.date))) return false
    
    const slotTime = new Date(slot.slot_time)
    const slotHour = slotTime.getHours()
    const slotMinute = slotTime.getMinutes()
    
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    
    // 현재 시간이 해당 슬롯의 15분 범위 내에 있는지 확인
    const slotStartMinutes = slotHour * 60 + slotMinute
    const slotEndMinutes = slotStartMinutes + 15
    const currentMinutes = currentHour * 60 + currentMinute
    
    return currentMinutes >= slotStartMinutes && currentMinutes < slotEndMinutes
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-muted-foreground">시간 기록</h3>
          {isToday(new Date(session.date)) && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <span className="animate-pulse">●</span>
              <span className="font-mono">{format(currentTime, "HH:mm")}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-0.5">
          {timeSlots.map((slot, index) => {
            const isCurrent = isCurrentTimeSlot(slot)
            return (
              <button
                key={index}
                className={`
                  h-10 p-1 text-xs border rounded-sm transition-all
                  ${isCurrent 
                    ? 'border-primary border-2 bg-primary/20 ring-2 ring-primary/30 animate-pulse' 
                    : 'border-border hover:border-primary/30 hover:bg-accent/50'
                  }
                  ${getSlotColor(slot)}
                `}
                onClick={() => handleSlotClick(slot)}
              >
                <div className={`font-mono text-[10px] ${isCurrent ? 'font-bold' : ''}`}>
                  {format(new Date(slot.slot_time), "HH:mm")}
                  {isCurrent && <span className="ml-1 text-[8px]">◈</span>}
                </div>
                {slot.activity && <div className="truncate text-[9px] mt-0.5">{slot.activity.slice(0, 6)}</div>}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 text-[10px] text-muted-foreground">
          <span>컨디션:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((level) => (
              <div key={level} className="flex items-center gap-0.5">
                <div className={`w-2 h-2 rounded-sm ${level <= 4 ? `bg-gray-${level * 100}` : 'bg-gray-900'}`}></div>
                <span>{level}</span>
              </div>
            ))}
          </div>
        </div>
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
