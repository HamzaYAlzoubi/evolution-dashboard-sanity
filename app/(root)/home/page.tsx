"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircleIcon, CheckCircle2Icon, Star, LogOut } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    project: "",
    date: "",
    hours: 0,
    minutes: 0,
    notes: "",
  })

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }))
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (status === "unauthenticated") {
    return null
  }

  const [Alertsuccess, setsuccess] = useState(false)
  const [AlertError, setAlertError] = useState(false)
  const [targetDialogOpen, setTargetDialogOpen] = useState(false)
  const [dailyTarget, setDailyTarget] = useState(session?.dailyTarget || 4) // Use session data
  const [targetInput, setTargetInput] = useState(dailyTarget)

  const projects = [
    { id: "proj-1", name: "مشروع ألف" },
    { id: "proj-2", name: "مشروع باء" },
    { id: "proj-3", name: "مشروع جيم" },
  ]

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleProjectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, project: value }))
  }

  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, date: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      (!formData.hours || Number(formData.hours) === 0) &&
      (!formData.minutes || Number(formData.minutes) === 0)
    ) {
      setAlertError(true)
      setTimeout(() => {
        setAlertError(false)
      }, 3000)
      return
    }

    console.log("بيانات الفورم:", formData)

    setsuccess(true)
    setTimeout(() => {
      setsuccess(false)
    }, 3000)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0F172B]">
      {/* Header with user info and sign out */}
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          مرحباً، {session?.name || session?.email}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        إضافة جلسة عمل
      </h1>
      {Alertsuccess && (
        <Alert className="absolute top-20 w-[90%] text-green-600">
          <CheckCircle2Icon />
          <AlertTitle>نجح! وفقك الله تعالى لكل خير</AlertTitle>
          <AlertDescription>تم حفظ الجلسة بنجاح.</AlertDescription>
        </Alert>
      )}
      {AlertError && (
        <Alert className="absolute top-20 w-[90%]" variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>فشل! لم يتم تسجيل الجلسة.</AlertTitle>
          <AlertDescription>انت لم تضع ساعات ودقائق للجلسة.</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-none border-none dark:bg-[#0F172B]">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 ">
            {/* المشروع - الآن سيلكت من شادسن */}
            <div className="space-y-2">
              <Label htmlFor="project">المشروع</Label>

              <Select
                value={formData.project}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger
                  id="project"
                  className="w-full dark:border-white"
                >
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* مدة الجلسة */}
            <div className="space-y-2">
              <Label>مدة الجلسة</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="hours"
                  placeholder="ساعة"
                  className="w-1/2 dark:border-white"
                  min="0"
                  value={formData.hours}
                  onChange={handleChange}
                />
                <Input
                  type="number"
                  name="minutes"
                  placeholder="دقيقة"
                  className="w-1/2 dark:border-white"
                  min="0"
                  value={formData.minutes}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* حقل تاريخ الجلسة */}
            <div className="space-y-2">
              <Label htmlFor="date">تاريخ الجلسة</Label>
              <Input
                type="date"
                id="date"
                name="date"
                className="w-full dark:border-white"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            {/* ملاحظات */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="(إختياري)"
                value={formData.notes}
                onChange={handleChange}
                className="dark:border-white"
              />
            </div>

            {/* زر الإضافة */}
            <Button
              type="submit"
              variant="outline"
              className="w-full dark:bg-[#6866F1] bg-[#0f172b] text-white"
            >
              إضافة الجلسة
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none border-none dark:bg-[#0F172B]">
        <CardTitle className="text-center text-lg font-semibold flex items-center justify-center gap-2">
          <span>الهدف اليومي</span>
        </CardTitle>
        <CardContent className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTargetDialogOpen(true)}
            >
              <Star className="text-yellow-500" />
            </Button>
            <span className="text-lg font-semibold">{dailyTarget} نجوم</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            أكمل {dailyTarget} ساعات من العمل اليوم لتحقيق الهدف.
          </p>
        </CardContent>
      </Card>

      {/* دايلوج تحديد الهدف اليومي */}
      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديد الهدف اليومي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="target">عدد الساعات المطلوبة يوميًا</Label>
            <Input
              id="target"
              type="number"
              min={1}
              value={targetInput}
              onChange={(e) => setTargetInput(Number(e.target.value))}
              className="mt-2"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setTargetDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                setDailyTarget(targetInput)
                setTargetDialogOpen(false)
              }}
            >
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
