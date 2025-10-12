import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPInput } from "./otp-input";
import { Loader2, MessageSquare, Phone, ArrowRight, Heart } from "lucide-react";
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
      <DialogContent className="max-w-[350px] max-h-[500px] w-[calc(100vw-2rem)] overflow-y-auto p-4 [&]:max-h-[min(500px,90vh)]" style={{ maxHeight: 'min(500px, 90vh)' }}>
        <DialogHeader className="sr-only">
          <DialogTitle>
            {step === "phone" ? "Phone Authentication" : step === "name" ? "Complete Profile" : "Verify OTP"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone" 
              ? "Enter your phone number to receive verification code" 
              : step === "name"
              ? "Enter your name to complete registration"
              : "Enter the 6-digit verification code"}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" && (
          <div className="flex flex-col items-center space-y-3 py-2">
            {/* Blue Phone Icon */}
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary-foreground" />
            </div>

            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold">Welcome to Easyread IQ</h2>
              <p className="text-muted-foreground text-xs">Enter your phone number to get started</p>
            </div>

            {/* Phone Verification Card */}
            <div className="w-full bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Phone Verification</h3>
                <p className="text-xs text-muted-foreground">
                  We'll send you a code via WhatsApp or SMS
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+2349023544240"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-8 h-9 text-sm border-2"
                      data-testid="input-phone"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Include country code (e.g., +234)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 text-sm"
                  disabled={loginWithoutOtpMutation.isPending || sendOtpMutation.isPending}
                  data-testid="button-submit-phone"
                >
                  {(loginWithoutOtpMutation.isPending || sendOtpMutation.isPending) && (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  Send Code
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>

                <p className="text-[10px] text-center text-muted-foreground pt-1">
                  By continuing, you agree to our Terms & Privacy Policy
                </p>
              </form>
            </div>
          </div>
        )}

        {step === "name" && (
          <div className="flex flex-col items-center space-y-3 py-2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary-foreground" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold">Complete Your Profile</h2>
              <p className="text-muted-foreground text-xs">Please enter your name to continue</p>
            </div>

            <div className="w-full bg-muted/30 rounded-lg p-4">
              <form onSubmit={(e) => { e.preventDefault(); setStep("otp"); }} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-sm border-2"
                    data-testid="input-name"
                  />
                </div>
                <Button type="submit" className="w-full h-9 text-sm" data-testid="button-submit-name">
                  Continue to OTP
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="flex flex-col items-center space-y-3 py-2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold">Verify Your Number</h2>
              <p className="text-muted-foreground text-xs">Enter the 6-digit code sent to your phone</p>
            </div>

            <div className="w-full bg-muted/30 rounded-lg p-4">
              <form onSubmit={handleOtpSubmit} className="space-y-3">
                <div className="flex flex-col items-center space-y-2">
                  <OTPInput value={otp} onChange={setOtp} />
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" />
                    Code sent via WhatsApp or SMS
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full h-9 text-sm"
                    disabled={verifyOtpMutation.isPending}
                    data-testid="button-verify-otp"
                  >
                    {verifyOtpMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                    Verify & Continue
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-8 text-xs"
                    onClick={() => sendOtpMutation.mutate(phoneNumber)}
                    disabled={sendOtpMutation.isPending}
                    data-testid="button-resend-otp"
                  >
                    {sendOtpMutation.isPending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                    Resend Code
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
