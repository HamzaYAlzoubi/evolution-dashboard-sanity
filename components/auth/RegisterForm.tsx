"use client";
import { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("جميع الحقول مطلوبة");
      return;
    }
    // تحقق من عدم وجود مستخدم بنفس البريد عبر API
    const existsRes = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkEmail: form.email }),
    });
    const existsData = await existsRes.json();
    if (existsData.exists) {
      setError("البريد الإلكتروني مستخدم بالفعل");
      return;
    }
    // إرسال البيانات للـ API لإنشاء مستخدم جديد (بدون تشفير هنا)
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        dailyTarget: 4,
      }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError("فشل في التسجيل");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0F172B]">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">تسجيل مستخدم جديد</h1>
      {success && (
        <Alert className="mb-4 text-green-600">
          <CheckCircle2Icon />
          <AlertTitle>تم التسجيل بنجاح!</AlertTitle>
          <AlertDescription>يمكنك الآن تسجيل الدخول.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>خطأ!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="shadow-none border-none dark:bg-[#0F172B] w-full max-w-md">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input name="name" id="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input type="email" name="email" id="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input type="password" name="password" id="password" value={form.password} onChange={handleChange} required />
            </div>
            <Button type="submit" className="w-full dark:bg-[#6866F1] bg-[#0f172b] text-white">تسجيل</Button>
            <Button type="button" className="w-full mt-2 bg-red-500 text-white" onClick={() => {/* TODO: Google Auth */}}>التسجيل بواسطة Google</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}