import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-gray-50 dark:bg-gray-900 dark:text-gray-100 md:mr-64 duration-300">
        <Sidebar />
        {children}
      </body>
    </html>
  );
}