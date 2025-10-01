"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  ClipboardList,
  BarChart,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  Sun,
  Moon,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { UserProfileForm } from "@/components/auth/UserProfileForm";
import NewSettingsDialog from "@/components/NewSettingsDialog";
import { sanityClient } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';

interface User {
  _id: string;
  name: string;
  image?: any;
}

const getUserQuery = `*[_type == "user" && _id == $userId][0] {
  _id,
  name,
  image,
  isAdmin,
}`;

const navItems = [
  { name: "الرئيسية", href: "/home", icon: Home },
  { name: "المشاريع", href: "/projects", icon: ClipboardList },
  { name: "الإحصائيات", href: "/statistics", icon: BarChart },
  { name: "مدير الجلسات", href: "/sessionsManager", icon: BookOpen },
  { name: "معسكر الإنجاز", href: "/achievement-camp", icon: Award },
];

const Sidebar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as 'light' | 'dark';
    }
    return 'light'; // Default theme
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (session?.user?.id) {
      sanityClient.fetch(getUserQuery, { userId: session.user.id })
        .then(data => {
          setCurrentUser(data);
        })
        .catch(error => {
          console.error("Failed to fetch current user data:", error);
        });
    }
  }, [session?.user?.id]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {!isMobileMenuOpen && (
        <div className="md:hidden fixed top-4 right-4 z-50">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
            <Menu className="h-8 w-8" />
          </Button>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-card border-r p-6 transition-transform duration-500 ease-in-out rounded-l-2xl shadow-lg
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
          md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/App Name */}
          <div className="mb-8 text-3xl font-extrabold text-primary flex justify-center items-center">
            <div>
              السبيل
              <p className="text-lg font-semibold text-muted-foreground">Al-Sabeel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-grow">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 py-3 px-4 rounded-lg text-base font-medium transition-colors duration-200
                        ${isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)} // Close mobile menu on link click
                    >
                      <item.icon className="h-6 w-6" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile / Settings */}
          <div className="mt-auto pt-6 border-t border-border/50">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors duration-200">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentUser.image ? urlFor(currentUser.image).width(100).url() : undefined} />
                      <AvatarFallback>
                        {currentUser.name ? currentUser.name.charAt(0) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-base font-semibold text-foreground">
                      {currentUser.name || "User"}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)} onSelect={(e) => e.preventDefault()}>
                        <Settings className="h-4 w-4 mr-2" />
                        الإعدادات
                      </DropdownMenuItem>
                  <NewSettingsDialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} currentUser={currentUser} />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3 py-3 px-4 text-base font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                  <LogOut className="h-6 w-6" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
