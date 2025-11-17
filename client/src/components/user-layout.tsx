import { Link, useLocation } from "wouter";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Home, User, LogIn, LogOut, CreditCard } from "lucide-react"; // Added CreditCard for Payment
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PhoneAuthModal } from "@/components/auth/phone-auth-modal";
import logoImage from "@assets/Easyread IQ _logo (512x512 px)_1760781141490.png";

// Assume useIsMobile hook is defined elsewhere and imported
// For example: import { useIsMobile } from "@/hooks/useIsMobile";
// Mocking useIsMobile for demonstration if it's not provided in the original context
const useIsMobile = () => {
  // Replace with actual mobile detection logic
  return window.innerWidth < 768;
};

// Modal component for "How to Pay"
const HowToPayModal = ({ open, onOpenChange }) => {
  if (!open) return null;

  const content = (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">How to Pay for the Premium Pack</h2>
      <p className="mb-4">
        Before you proceed with payment, please follow these steps to ensure a smooth experience:
      </p>

      <h3 className="text-lg font-semibold mb-2">1. Confirm You’re Logged In</h3>
      <p className="mb-4">
        Make sure you are currently logged into your account.
        If you have been logged in for a long time, please log out and log in again.
        Because the app is designed to work offline, it may store stale data in your browser.
      </p>

      <h3 className="text-lg font-semibold mb-2">2. Clear Your Browser Cache (Important)</h3>
      <p className="mb-4">
        Clearing your cache removes outdated files that may affect the payment process.
      </p>

      <h4 className="text-md font-semibold mb-2">How to clear cache in Google Chrome:</h4>
      <ul className="list-disc list-inside mb-4">
        <li>Open Chrome.</li>
        <li>Click the three dots (menu) at the top-right corner.</li>
        <li>Select Settings.</li>
        <li>Click Privacy and security.</li>
        <li>Select Clear browsing data.</li>
        <li>Choose Cached images and files (you may leave other options unchecked).</li>
        <li>Click Clear data.</li>
        <li>Close and reopen your browser.</li>
      </ul>

      <h3 className="text-lg font-semibold mb-2">Payment Steps</h3>
      <p className="mb-4">
        On the dashboard, click Premium and wait to be redirected to the payment gateway.
        Choose your preferred payment method — Card, Bank Transfer, or USSD.
        After a successful payment, wait to be automatically redirected back to your dashboard.
      </p>

      <h3 className="text-lg font-semibold mb-2">After Payment</h3>
      <p className="mb-4">
        Congratulations! You are now a Premium Member and can access all premium content.
      </p>

      <p className="text-sm text-gray-500">
        Note: Access and payment terms may be updated from time to time without prior notice.
      </p>
    </div>
  );

  // Basic modal implementation - replace with a more robust UI library if available (e.g., Shadcn/ui Dialog)
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'hidden'}`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-w-md mx-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Payment Information</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        {content}
      </div>
    </div>
  );
};

// Mobile Bottom Navigation Component
const MobileBottomNav = () => {
  const [location] = useLocation();
  const { user } = useAuthStore();
  const [showHowToPayModal, setShowHowToPayModal] = useState(false);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    user && { href: "/profile", icon: User, label: "Profile" },
    { href: "#how-to-pay", icon: CreditCard, label: "Payment", onClick: () => setShowHowToPayModal(true) },
    user ? { href: "#logout", icon: LogOut, label: "Logout", onClick: () => { /* handle logout logic here or in parent */ } } :
    { href: "/login", icon: LogIn, label: "Login", onClick: () => { /* handle login logic here or in parent */ } }
  ].filter(Boolean); // Filter out undefined items if user is null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4 md:hidden">
      {navItems.map((item) => (
        item.onClick ? (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center gap-1"
            onClick={item.onClick}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 rounded-md",
              location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </Link>
        )
      ))}
      <HowToPayModal open={showHowToPayModal} onOpenChange={setShowHowToPayModal} />
    </nav>
  );
};


interface UserLayoutProps {
  children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useIsMobile(); // Use the hook to determine if it's a mobile device

  const handleLogout = () => {
    logout();
    // Redirect to home or login page after logout
    window.location.href = "/";
  };

  // Conditional rendering for logout/login button in header based on user status and mobile
  const authButton = user ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      data-testid="button-logout"
      className="hidden md:inline-flex" // Hide on mobile, will be in bottom nav
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
      className="hidden md:inline-flex" // Hide on mobile, will be in bottom nav
    >
      <LogIn className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline">Login</span>
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img src={logoImage} alt="Easyread IQ" className="h-8 w-8" />
              <span className="hidden md:inline font-bold text-lg">Easyread IQ</span>
            </Link>
          </div>

          <nav className="flex items-center gap-2 md:gap-4">
            <Link href="/">
              <Button
                variant={location === "/" ? "default" : "ghost"}
                size="sm"
                className="gap-2 hidden md:flex" // Hide on mobile, handled by bottom nav
                data-testid="nav-home"
              >
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">Home</span>
              </Button>
            </Link>

            {user && (
              <Link href="/profile">
                <Button
                  variant={location === "/profile" ? "default" : "ghost"}
                  size="sm"
                  className="gap-2 hidden md:flex" // Hide on mobile, handled by bottom nav
                  data-testid="nav-profile"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">Profile</span>
                </Button>
              </Link>
            )}

            <ThemeToggle />
            {authButton}
          </nav>
        </div>
      </header>
      <main className={cn(user && isMobile && "pb-16")}>{children}</main>
      {user && <MobileBottomNav />}
      <PhoneAuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}