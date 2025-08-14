"use client";
import Link from "next/link"

import { useState } from "react";
import { FiMenu } from "react-icons/fi";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden fixed top-4 right-4 z-50 p-2 text-2xl bg-white rounded-md shadow"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiMenu />
      </button>

      <aside
        className={`
            fixed top-0 right-0 h-screen w-64 text-gray-800 bg-white p-4 z-50 transform transition-transform duration-300
            ${isOpen ? "translate-x-0" : "translate-x-full"}
            md:translate-x-0 md:block
          `}
      >
        <nav className="flex flex-col space-y-4 p-4">
          <Link className="p-4 bg-[#0f172b] text-white rounded-b-xl"  href="/">الصفحة الرئيسية</Link>
          <Link className="p-4 bg-[#0f172b] text-white rounded-b-xl"  href="/projects">المشاريع</Link>
          <Link className="p-4 bg-[#0f172b] text-white rounded-b-xl"  href="/sessionsManager">مدير الجلسات</Link>
        </nav>

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