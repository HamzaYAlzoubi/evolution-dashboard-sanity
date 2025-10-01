import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Providers } from "@/components/auth/Providers";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "السبيل",
  description: "لوحة تحكم السبيل",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/icons/icon-light.png",
        href: "/icons/icon-light.png",
        sizes: "256x256",
        type: "image/png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/icons/icon-dark.png",
        href: "/icons/icon-dark.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
