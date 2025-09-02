"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { format, subDays, startOfWeek, endOfWeek } from "date-fns"
import { ko } from "date-fns/locale"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Download, TrendingUp, Clock, Activity } from "lucide-react"

interface AnalyticsData {
  date: string
  avgCondition: number
  totalSlots: number
  activeSlots: number
}

interface ActivityData {
  activity: string
  count: number
  avgCondition: number
}

interface DataAnalyticsProps {
  userId: string
}

export function DataAnalytics({ userId }: DataAnalyticsProps) {
  const [weeklyData, setWeeklyData] = useState<AnalyticsData[]>([])
  const [topActivities, setTopActivities] = useState<ActivityData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      const today = new Date()
      const weekStart = startOfWeek(today, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

      // Load weekly condition trends
      const { data: sessions, error: sessionsError } = await supabase
        .from("daily_sessions")
        .select(`
          date,
          time_slots (
            activity,
            condition_score
          )
        `)
        .eq("user_id", userId)
        .gte("date", format(subDays(today, 30), "yyyy-MM-dd"))
        .order("date", { ascending: true })

      if (sessionsError) throw sessionsError

      // Process weekly data
      const processedData: AnalyticsData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i)
        const dateStr = format(date, "yyyy-MM-dd")
        const dayData = sessions?.find((s) => s.date === dateStr)

        if (dayData?.time_slots) {
          const slots = dayData.time_slots as any[]
          const activeSlots = slots.filter((s) => s.condition_score)
          const avgCondition =
            activeSlots.length > 0 ? activeSlots.reduce((sum, s) => sum + s.condition_score, 0) / activeSlots.length : 0

          processedData.push({
            date: format(date, "M/d", { locale: ko }),
            avgCondition: Math.round(avgCondition * 10) / 10,
            totalSlots: slots.length,
            activeSlots: activeSlots.length,
          })
        } else {
          processedData.push({
            date: format(date, "M/d", { locale: ko }),
            avgCondition: 0,
            totalSlots: 0,
            activeSlots: 0,
          })
        }
      }

      setWeeklyData(processedData)

      // Load top activities
      const { data: activities, error: activitiesError } = await supabase
        .from("time_slots")
        .select("activity, condition_score")
        .eq("user_id", userId)
        .not("activity", "is", null)
        .gte("created_at", format(subDays(today, 30), "yyyy-MM-dd"))

      if (activitiesError) throw activitiesError

      // Process activities data
      const activityMap = new Map<string, { count: number; totalCondition: number }>()

      activities?.forEach((slot) => {
        if (slot.activity && slot.condition_score) {
          const existing = activityMap.get(slot.activity) || { count: 0, totalCondition: 0 }
          activityMap.set(slot.activity, {
            count: existing.count + 1,
            totalCondition: existing.totalCondition + slot.condition_score,
          })
        }
      })

      const topActivitiesData = Array.from(activityMap.entries())
        .map(([activity, data]) => ({
          activity,
          count: data.count,
          avgCondition: Math.round((data.totalCondition / data.count) * 10) / 10,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setTopActivities(topActivitiesData)
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_sessions")
        .select(`
          date,
          start_time,
          end_time,
          time_slots (
            slot_time,
            activity,
            condition_score
          )
        `)
        .eq("user_id", userId)
        .order("date", { ascending: false })

      if (error) throw error

      // Convert to CSV
      const csvData = []
      csvData.push(["날짜", "시작시간", "종료시간", "슬롯시간", "활동", "컨디션"])

      data?.forEach((session) => {
        const slots = session.time_slots as any[]
        if (slots.length > 0) {
          slots.forEach((slot) => {
            csvData.push([
              session.date,
              session.start_time ? format(new Date(session.start_time), "HH:mm") : "",
              session.end_time ? format(new Date(session.end_time), "HH:mm") : "",
              format(new Date(slot.slot_time), "HH:mm"),
              slot.activity || "",
              slot.condition_score || "",
            ])
          })
        } else {
          csvData.push([
            session.date,
            session.start_time ? format(new Date(session.start_time), "HH:mm") : "",
            session.end_time ? format(new Date(session.end_time), "HH:mm") : "",
            "",
            "",
            "",
          ])
        }
      })

      const csvContent = csvData.map((row) => row.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `planner-data-${format(new Date(), "yyyy-MM-dd")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="ml-2">데이터 분석 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalActiveSlots = weeklyData.reduce((sum, day) => sum + day.activeSlots, 0)
  const avgWeeklyCondition =
    weeklyData.length > 0
      ? weeklyData.reduce((sum, day) => sum + day.avgCondition, 0) / weeklyData.filter((d) => d.avgCondition > 0).length
      : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                데이터 분석
              </CardTitle>
              <CardDescription>지난 7일간의 활동 패턴과 컨디션 분석</CardDescription>
            </div>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalActiveSlots}</p>
                <p className="text-xs text-muted-foreground">주간 기록된 슬롯</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{avgWeeklyCondition.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">평균 컨디션</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="trends">컨디션 트렌드</TabsTrigger>
          <TabsTrigger value="activities">활동 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">주간 컨디션 변화</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 7]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgCondition"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">일별 활동량</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="activeSlots" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">자주 하는 활동 (최근 30일)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.activity}</p>
                      <p className="text-xs text-muted-foreground">{activity.count}회 기록</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">평균 {activity.avgCondition}</p>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((score) => (
                          <div
                            key={score}
                            className={`w-2 h-2 rounded-full ${
                              score <= activity.avgCondition ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {topActivities.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">아직 기록된 활동이 없습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
