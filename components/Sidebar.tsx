"use client";
import Link from "next/link"

import { useState, useEffect } from "react";
import { FiMenu } from "react-icons/fi";
import { MdOutlineDarkMode } from "react-icons/md";
import { LuSun } from "react-icons/lu";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

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
          <Link className="p-4 dark:bg-[#6866F1] bg-[#101828] text-white rounded-b-xl"  href="/">الصفحة الرئيسية</Link>
          <Link className="p-4 dark:bg-[#6866F1] bg-[#0F172B] text-white rounded-b-xl"  href="/projects">المشاريع</Link>
          <Link className="p-4 dark:bg-[#6866F1] bg-[#0F172B] text-white rounded-b-xl"  href="/sessionsManager">مدير الجلسات</Link>
          <Link className="p-4 dark:bg-[#6866F1] bg-[#0F172B] text-white rounded-b-xl"  href="/login">Login</Link>
        </nav>
        <div className="absolute bottom-20 left-0 w-full flex justify-center">
          <button
            className="p-2 px-4 rounded-md shadow border border-gray-300 bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200"
            onClick={() => setDark((prev) => !prev)}
          >
            {dark ? <LuSun/> : <MdOutlineDarkMode />}
          </button>
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