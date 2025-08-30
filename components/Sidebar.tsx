'use client';
import Link from "next/link"

import { useState, useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import { MdOutlineDarkMode } from "react-icons/md";
import { LuSun } from "react-icons/lu";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Sidebar({ name }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDark(true);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (dark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  }, [dark, isMounted]);

  return (
    <>
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 text-2xl bg-white dark:bg-gray-900 dark:text-gray-100 rounded-md shadow"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiMenu />
      </button>

      <aside
        className={`
            fixed top-0 right-0 h-screen w-64 text-gray-900 bg-white dark:bg-[#0F172B] p-4 z-50 transform transition-transform duration-300
            ${isOpen ? "translate-x-0" : "translate-x-full"}
            md:translate-x-0 md:block 
          `}
      >
        <nav className="flex flex-col space-y-4 p-4">
          <Link className="p-4 dark:bg-[#6866F1] bg-[#101828] text-white rounded-b-xl" href="/home">الصفحة الرئيسية</Link>
          <Link className="p-4 dark:bg-[#6866F1] bg-[#0F172B] text-white rounded-b-xl" href="/projects">المشاريع</Link>
          <Link className="p-4 dark:bg-[#6866F1] bg-[#0F172B] text-white rounded-b-xl" href="/sessionsManager">مدير الجلسات</Link>
          <Link className="p-4 dark:bg-[#6866F1] bg-[#0F172B] text-white rounded-b-xl" href="/statistics">ﺇحصائيات</Link>
        </nav>
        <div className="absolute bottom-10 left-0 w-full flex flex-col items-center gap-2 px-4 dark:text-white">
          {isMounted ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setDark((prev) => !prev)}
            >
              {dark ? <LuSun /> : <MdOutlineDarkMode />}
              <span>{dark ? 'وضع نهاري' : 'وضع ليلي'}</span>
            </Button>
          ) : (
            <div className="w-full h-9 rounded-md bg-gray-200 dark:bg-gray-900 animate-pulse"></div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>

          <div className="text-sm text-gray-600 dark:text-gray-400 mt-[10px]">
            مرحباً، {name}
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.1)] z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}