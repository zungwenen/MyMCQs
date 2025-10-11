import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PaymentModal({ open, onOpenChange, onSuccess }: PaymentModalProps) {
  const { toast } = useToast();

  const { data: settings } = useQuery({
    queryKey: ["/api/payment-settings"],
    enabled: open,
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/initialize", {});
      return res;
    },
    onSuccess: (data) => {
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    },
  });

  const price = settings?.membershipPrice ? (settings.membershipPrice / 100).toFixed(2) : "50.00";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Crown className="h-6 w-6 text-premium" />
            Get Premium Access
          </DialogTitle>
          <DialogDescription>
            Unlock all premium quizzes and subjects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-premium/10 border border-premium/20 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">One-time payment</p>
            <p className="text-4xl font-bold text-premium">₦{price}</p>
            <p className="text-sm text-muted-foreground mt-2">Lifetime access to all premium content</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success" />
              <p className="text-sm">Access to all premium subjects</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success" />
              <p className="text-sm">Unlimited quiz attempts</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success" />
              <p className="text-sm">Detailed performance analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success" />
              <p className="text-sm">Priority support</p>
            </div>
          </div>

          <Button
            onClick={() => initializePaymentMutation.mutate()}
            disabled={initializePaymentMutation.isPending}
            className="w-full bg-premium hover:bg-premium/90 text-premium-foreground"
            size="lg"
            data-testid="button-pay-now"
          >
            {initializePaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Pay Now with Paystack
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
