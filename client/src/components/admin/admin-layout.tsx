import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LayoutDashboard, BookOpen, Settings, LogOut, List } from "lucide-react";
import { cn } from "@/lib/utils";
import logoImage from "@assets/Easyread IQ _logo (512x512 px)_1760781141490.png";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { admin, logout } = useAuthStore();

  if (!admin) {
    return null;
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { href: "/admin/quizzes", label: "Quizzes", icon: List },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard">
              <div className="flex items-center gap-2">
                <img src={logoImage} alt="Easyread IQ" className="h-9 w-auto" />
                <span className="text-lg font-bold hidden sm:inline">Admin</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "gap-2",
                        isActive && "bg-accent"
                      )}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                window.location.href = "/admin/login";
              }}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
