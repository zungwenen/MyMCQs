import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOSDevice = (
      (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) ||
      (ua.includes('Mac') && navigator.maxTouchPoints > 1)
    );
    setIsIOS(isIOSDevice);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const installed = localStorage.getItem('pwa-installed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      localStorage.setItem('pwa-installed', 'true');
    }

    if (isIOSDevice && !dismissed && !installed && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (!dismissed && !installed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa-installed', 'true');
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up" data-testid="pwa-install-prompt-ios">
        <Card className="border-primary/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Install Easyread IQ</CardTitle>
                  <CardDescription className="text-sm">Get the app experience on your iPhone</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDismiss}
                data-testid="button-dismiss-install"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              1. Tap the <strong>Share</strong> button in Safari
            </p>
            <p className="text-muted-foreground">
              2. Select <strong>"Add to Home Screen"</strong>
            </p>
            <p className="text-muted-foreground">
              3. Tap <strong>Add</strong> to install
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up" data-testid="pwa-install-prompt">
        <Card className="border-primary/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Install Easyread IQ</CardTitle>
                  <CardDescription className="text-sm">Get the full app experience on your device</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleDismiss}
                data-testid="button-dismiss-install"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleInstallClick}
              className="w-full"
              data-testid="button-install-app"
            >
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
