import Sidebar from "@/components/Sidebar";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
        <Sidebar />
        {children}
      </body>
    </html>
  );
}