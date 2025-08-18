import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"


export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const router = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // تحقق من المستخدم عبر API
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkEmail: email }),
    });
    const data = await res.json();
    const user = data.user;
    if (!user) {
      setError("لا يوجد مستخدم بهذا البريد الإلكتروني");
      setIsLoading(false);
      return;
    }
    // تحقق من كلمة المرور (يجب التحقق منها عبر API أو NextAuth وليس هنا)
    // تسجيل الدخول عبر NextAuth
    const signInRes = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (!signInRes?.ok) {
      setError("كلمة المرور غير صحيحة");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard")
    setIsLoading(false)
  }



  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>تسجيل الدخول الى حسابك</CardTitle>
          <CardDescription>
            ادخل البريد الالكتروني وكلمة المرور الخاصة بك لتسجيل الدخول.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الالكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">كلمة المرور</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  هل نسيت كلمة السر ؟
                </a>
              </div>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full">
                تسجيل الدخول
              </Button>
              <Button variant="outline" className="w-full">
                Login with Google
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            ليس لديك حساب ؟{" "}
            <Link href="/register" className="underline underline-offset-4">
              سجل حساب جديد
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
