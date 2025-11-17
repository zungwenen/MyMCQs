
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, User, CreditCard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { HowToPayModal } from "./how-to-pay-modal";
import { useIsMobile } from "@/hooks/use-mobile";

export function MobileBottomNav() {
  const [location] = useLocation();
  const { logout } = useAuthStore();
  const isMobile = useIsMobile();
  const [showHowToPayModal, setShowHowToPayModal] = useState(false);

  if (!isMobile) {
    return null;
  }

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      action: null,
    },
    {
      label: "Profile",
      icon: User,
      href: "/profile",
      action: null,
    },
    {
      label: "How to Pay",
      icon: CreditCard,
      href: null,
      action: () => setShowHowToPayModal(true),
    },
    {
      label: "Logout",
      icon: LogOut,
      href: null,
      action: handleLogout,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === location;

            if (item.action) {
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 transition-colors",
                    "hover:bg-accent active:bg-accent/80",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href!}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  "hover:bg-accent active:bg-accent/80",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <HowToPayModal open={showHowToPayModal} onOpenChange={setShowHowToPayModal} />
    </>
  );
}
