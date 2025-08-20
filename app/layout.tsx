import "./globals.css"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { Providers } from "@/components/auth/Providers"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}
