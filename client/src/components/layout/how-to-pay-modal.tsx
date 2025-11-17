
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard } from "lucide-react";

interface HowToPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HowToPayModal({ open, onOpenChange }: HowToPayModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            How to Pay for the Premium Pack
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-8rem)] pr-4">
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Before you proceed with payment, please follow these steps to ensure a smooth experience:
            </p>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-base mb-2">1. Confirm You're Logged In</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>Make sure you are currently logged into your account.</li>
                  <li>If you have been logged in for a long time, please log out and log in again.</li>
                  <li>Because the app is designed to work offline, it may store stale data in your browser.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-2">2. Clear Your Browser Cache (Important)</h3>
                <p className="text-muted-foreground mb-2">
                  Clearing your cache removes outdated files that may affect the payment process.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="font-medium">How to clear cache in Google Chrome:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Open Chrome.</li>
                    <li>Click the three dots (menu) at the top-right corner.</li>
                    <li>Select <strong>Settings</strong>.</li>
                    <li>Click <strong>Privacy and security</strong>.</li>
                    <li>Select <strong>Clear browsing data</strong>.</li>
                    <li>Choose <strong>Cached images and files</strong> (you may leave other options unchecked).</li>
                    <li>Click <strong>Clear data</strong>.</li>
                    <li>Close and reopen your browser.</li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-2">Payment Steps</h3>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                  <li>On the dashboard, click <strong>Premium</strong> and wait to be redirected to the payment gateway.</li>
                  <li>Choose your preferred payment method — Card, Bank Transfer, or USSD.</li>
                  <li>After a successful payment, wait to be automatically redirected back to your dashboard.</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-base mb-2">After Payment</h3>
                <p className="text-muted-foreground">
                  Congratulations! You are now a Premium Member and can access all premium content.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Access and payment terms may be updated from time to time without prior notice.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
