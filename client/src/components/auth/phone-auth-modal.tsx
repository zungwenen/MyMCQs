import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPInput } from "./otp-input";
import { Loader2, MessageSquare } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";

interface PhoneAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhoneAuthModal({ open, onOpenChange }: PhoneAuthModalProps) {
  const [step, setStep] = useState<"phone" | "otp" | "name">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const { setUser } = useAuthStore();
  const { toast } = useToast();

  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiRequest("POST", "/api/auth/send-otp", { phoneNumber: phone });
      return res;
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setStep(data.requiresName ? "name" : "otp");
      toast({
        title: "OTP Sent",
        description: data.message || "Check WhatsApp or SMS for your code",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { sessionId: string; otp: string; name?: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", data);
      return res;
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Success",
        description: "You're logged in!",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    },
  });

  const loginWithoutOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const res = await apiRequest("POST", "/api/auth/login-without-otp", { phoneNumber: phone });
      return res;
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Welcome back!",
        description: "You're logged in",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      sendOtpMutation.mutate(phoneNumber);
    },
  });

  const resetForm = () => {
    setStep("phone");
    setPhoneNumber("");
    setOtp("");
    setName("");
    setSessionId("");
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    loginWithoutOtpMutation.mutate(phoneNumber);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }
    verifyOtpMutation.mutate({ sessionId, otp, name: name || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === "phone" ? "Welcome to Easyread IQ" : step === "name" ? "Complete Your Profile" : "Verify Your Number"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone" 
              ? "Enter your phone number to get started" 
              : step === "name"
              ? "Please enter your name to continue"
              : "Enter the 6-digit code sent to your phone"}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-3"
                  data-testid="input-phone"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginWithoutOtpMutation.isPending || sendOtpMutation.isPending}
              data-testid="button-submit-phone"
            >
              {(loginWithoutOtpMutation.isPending || sendOtpMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Continue
            </Button>
          </form>
        )}

        {step === "name" && (
          <form onSubmit={(e) => { e.preventDefault(); setStep("otp"); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-name"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="button-submit-name">
              Continue to OTP
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <OTPInput value={otp} onChange={setOtp} />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Code sent via WhatsApp or SMS
              </p>
            </div>
            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                disabled={verifyOtpMutation.isPending}
                data-testid="button-verify-otp"
              >
                {verifyOtpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Continue
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => sendOtpMutation.mutate(phoneNumber)}
                disabled={sendOtpMutation.isPending}
                data-testid="button-resend-otp"
              >
                Resend Code
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
