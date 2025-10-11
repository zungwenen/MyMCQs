import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get("reference");

  const verifyPaymentMutation = useMutation({
    mutationFn: async (ref: string) => {
      const res = await apiRequest("GET", `/api/payments/verify/${ref}`, undefined);
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/user"] });
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    },
    onError: () => {
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        setLocation("/");
      }, 3000);
    },
  });

  useEffect(() => {
    if (reference) {
      verifyPaymentMutation.mutate(reference);
    } else {
      setLocation("/");
    }
  }, [reference]);

  const isSuccess = verifyPaymentMutation.isSuccess && verifyPaymentMutation.data?.status && verifyPaymentMutation.data?.data?.status === "success";
  const isError = verifyPaymentMutation.isError || (verifyPaymentMutation.isSuccess && (!verifyPaymentMutation.data?.status || verifyPaymentMutation.data?.data?.status !== "success"));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {verifyPaymentMutation.isPending && (
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          {isSuccess && (
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
            </div>
          )}
          {isError && (
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
          )}
          
          <CardTitle className="text-2xl">
            {verifyPaymentMutation.isPending && "Verifying Payment..."}
            {isSuccess && "Payment Successful!"}
            {isError && "Payment Failed"}
          </CardTitle>
          
          <CardDescription>
            {verifyPaymentMutation.isPending && "Please wait while we verify your payment"}
            {isSuccess && "Your premium access has been activated"}
            {isError && "There was an issue with your payment"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {isSuccess && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                You now have access to all premium content!
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          )}
          
          {isError && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your payment could not be verified. Please try again or contact support.
              </p>
              <Button onClick={() => setLocation("/")} variant="outline" data-testid="button-back-home">
                Back to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
