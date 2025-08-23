"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2Icon, AlertCircleIcon, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  })

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!form.name || !form.email || !form.password) {
      setError("يرجى ملء جميع الحقول")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password, // Reminder: Hash passwords in a real app
        }),
      })

      if (res.status === 409) {
        setError("هذا البريد الإلكتروني مسجل بالفعل")
      } else if (res.ok) {
        setSuccess(true)
        setError("")
        setForm({ name: "", email: "", password: "" })
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        const data = await res.json()
        setError(data.error || "حدث خطأ ما. يرجى المحاولة مرة أخرى.")
      }
    } catch {
      setError("فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0F172B]">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        تسجيل مستخدم جديد
      </h1>
      {success && (
        <Alert className="mb-4 text-green-600 bg-green-50 border-green-200">
          <CheckCircle2Icon className="h-4 w-4" />
          <AlertTitle>تم التسجيل بنجاح!</AlertTitle>
          <AlertDescription>جاري تحويلك لصفحة تسجيل الدخول...</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>خطأ في التسجيل</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="shadow-none border-none dark:bg-[#0F172B] w-full max-w-md">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-right w-full block">
                الاسم
              </Label>
              <Input
                name="name"
                id="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right w-full block">
                البريد الإلكتروني
              </Label>
              <Input
                type="email"
                name="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-right w-full block">
                كلمة المرور
              </Label>
              <Input
                type="password"
                name="password"
                id="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full dark:bg-[#6866F1] bg-[#0f172b] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "تسجيل"
              )}
            </Button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              لديك حساب بالفعل؟{" "}
              <a href="/login" className="font-semibold text-[#6866F1]">
                سجل الدخول
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
