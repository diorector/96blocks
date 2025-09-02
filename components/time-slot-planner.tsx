"use client"

// TimeSlotPlanner - 날짜별 데이터 보기 기능 추가
// 2025-09-03 03:24 KST - 날짜 네비게이션 기능 구현

import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimeSlotGrid } from "@/components/time-slot-grid"
import { DayControls } from "@/components/day-controls"
import { NotificationManager } from "@/components/notification-manager"
import { DataAnalytics } from "@/components/data-analytics"
import { InstallPrompt } from "@/components/install-prompt"
import { createClient } from "@/lib/supabase/client"
import { format, addDays, subDays, startOfDay } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, BarChart3, LogIn, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DailySession {
  id: string
  date: string
  start_time: string | null
  end_time: string | null
}

interface TimeSlotPlannerProps {
  user?: User
}

export function TimeSlotPlanner({ user }: TimeSlotPlannerProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(user || null)
  const [currentSession, setCurrentSession] = useState<DailySession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const supabase = createClient()
  const today = format(new Date(), "yyyy-MM-dd")
  const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd")

  useEffect(() => {
    if (!user) {
      checkAuth()
    } else {
      loadSessionForDate()
    }
  }, [user, selectedDate])

  const checkAuth = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      setCurrentUser(authUser)
      if (authUser) {
        loadSessionForDate(authUser.id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setIsLoading(false)
    }
  }

  const loadSessionForDate = async (userId?: string) => {
    const targetUserId = userId || currentUser?.id
    if (!targetUserId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("daily_sessions")
        .select("*")
        .eq("user_id", targetUserId)
        .eq("date", formattedSelectedDate)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error loading session:", error)
        return
      }

      setCurrentSession(data || null)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setCurrentSession(null)
  }

  const handleSignIn = () => {
    window.location.href = "/auth/login"
  }

  const isSessionActive = currentSession?.start_time && !currentSession?.end_time

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto max-w-md p-4">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <LogIn className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold mb-2">15분 플래너</h2>
              <p className="text-muted-foreground mb-4">시간을 15분 단위로 기록하고 분석해보세요</p>
            </div>
            <Button onClick={handleSignIn} className="w-full">
              로그인하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleDateChange = (days: number) => {
    const newDate = days === 0 ? new Date() : addDays(selectedDate, days)
    setSelectedDate(newDate)
  }

  const isToday = format(selectedDate, "yyyy-MM-dd") === today

  return (
    <div className="container mx-auto max-w-md p-4 space-y-3">
      <InstallPrompt />
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{format(selectedDate, "M월 d일 EEEE", { locale: ko })}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 px-2 text-xs">
              로그아웃
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            일별 기록
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            분석
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* 날짜 네비게이션 */}
          <Card className="border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateChange(-1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        {format(selectedDate, "yyyy.MM.dd")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <CalendarPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          if (date) {
                            setSelectedDate(date)
                            setCalendarOpen(false)
                          }
                        }}
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {!isToday && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDateChange(0)}
                      className="h-8 px-2 text-xs"
                    >
                      오늘
                    </Button>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDateChange(1)}
                  className="h-8 w-8 p-0"
                  disabled={format(addDays(selectedDate, 1), "yyyy-MM-dd") > today}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <DayControls
                session={currentSession}
                onSessionUpdate={setCurrentSession}
                userId={currentUser.id}
                today={formattedSelectedDate}
              />

              <NotificationManager isSessionActive={!!isSessionActive} />

              {currentSession && currentSession.start_time && (
                <TimeSlotGrid session={currentSession} userId={currentUser.id} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <DataAnalytics userId={currentUser.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
