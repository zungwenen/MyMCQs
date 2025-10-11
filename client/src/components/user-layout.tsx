import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Home, User, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PhoneAuthModal } from "@/components/auth/phone-auth-modal";

interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <h1 className="text-xl md:text-2xl font-bold">Easyread IQ</h1>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className={cn(location === "/" && "bg-accent")}
                data-testid="nav-home"
              >
                <Home className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Home</span>
              </Button>
            </Link>
            {user && (
              <Link href="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(location === "/profile" && "bg-accent")}
                  data-testid="nav-profile"
                >
                  <User className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Profile</span>
                </Button>
              </Link>
            )}
            <ThemeToggle />
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                data-testid="button-login"
              >
                <LogIn className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Login</span>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <PhoneAuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
