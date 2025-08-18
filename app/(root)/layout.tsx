import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div dir="rtl" className="md:mr-64 duration-300">
        <Sidebar />
        {children}
      </div>
  );
}