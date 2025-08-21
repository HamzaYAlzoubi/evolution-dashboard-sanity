import { LoginForm } from "@/components/auth/login-form";

export default  function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center dark:text-white">
          تسجيل الدخول
        </h1>
        <p className="text-center mb-4 text-gray-600 dark:text-gray-400">
          مرحبًا بك في لوحة التحكم، يرجى تسجيل الدخول للوصول إلى حسابك.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
