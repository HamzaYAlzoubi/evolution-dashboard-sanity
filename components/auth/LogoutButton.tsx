"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export default function LogoutButton({
  variant = "outline",
  size = "sm",
  className = "",
  showIcon = true,
  children,
}: LogoutButtonProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      className={`flex items-center gap-2 ${className}`}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {children || "تسجيل الخروج"}
    </Button>
  )
}

