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
      <DialogContent className="sm:max-w-xl">
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
          <div className="flex flex-col items-center space-y-6 py-4">
            {/* Blue Phone Icon */}
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <Phone className="h-10 w-10 text-primary-foreground" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">Welcome to Easyread IQ</h2>
              <p className="text-muted-foreground text-sm md:text-base">Enter your phone number to get started</p>
            </div>

            {/* Phone Verification Card */}
            <div className="w-full bg-muted/30 rounded-xl p-6 md:p-8 space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Phone Verification</h3>
                <p className="text-sm text-muted-foreground">
                  We'll send you a verification code via WhatsApp or SMS
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+2349023544240"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 h-12 text-base border-2"
                      data-testid="input-phone"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +234 for Nigeria)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loginWithoutOtpMutation.isPending || sendOtpMutation.isPending}
                  data-testid="button-submit-phone"
                >
                  {(loginWithoutOtpMutation.isPending || sendOtpMutation.isPending) && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  Send Verification Code
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-xs text-center text-muted-foreground pt-2">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </div>
          </div>
        )}

        {step === "name" && (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <Phone className="h-10 w-10 text-primary-foreground" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">Complete Your Profile</h2>
              <p className="text-muted-foreground text-sm md:text-base">Please enter your name to continue</p>
            </div>

            <div className="w-full bg-muted/30 rounded-xl p-6 md:p-8">
              <form onSubmit={(e) => { e.preventDefault(); setStep("otp"); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-base border-2"
                    data-testid="input-name"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base" data-testid="button-submit-name">
                  Continue to OTP
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="flex flex-col items-center space-y-6 py-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-primary-foreground" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">Verify Your Number</h2>
              <p className="text-muted-foreground text-sm md:text-base">Enter the 6-digit code sent to your phone</p>
            </div>

            <div className="w-full bg-muted/30 rounded-xl p-6 md:p-8">
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
                    className="w-full h-12 text-base"
                    disabled={verifyOtpMutation.isPending}
                    data-testid="button-verify-otp"
                  >
                    {verifyOtpMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Verify & Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-11"
                    onClick={() => sendOtpMutation.mutate(phoneNumber)}
                    disabled={sendOtpMutation.isPending}
                    data-testid="button-resend-otp"
                  >
                    {sendOtpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
