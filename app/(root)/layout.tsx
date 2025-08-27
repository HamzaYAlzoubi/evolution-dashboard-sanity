import Sidebar from "@/components/Sidebar";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "السبيل",
  description: "لوحة تحكم السبيل",
  icons: {
    icon: [
      { url: "/icons/icon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/icon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return (
    <div dir="rtl" className="md:mr-64 duration-300">
      <Sidebar name={session?.user?.name} />
      {children}
    </div>
  );
}