import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSetup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check if setup is needed
  const { data: setupCheck, isLoading: checkingSetup } = useQuery<{ needsSetup: boolean }>({
    queryKey: ["/api/admin/setup-needed"],
  });

  // Redirect to login if setup is already complete
  useEffect(() => {
    if (setupCheck && !setupCheck.needsSetup) {
      setLocation("/admin/login");
    }
  }, [setupCheck, setLocation]);

  const setupMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/setup", data);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Super admin account created successfully! You can now login.",
      });
      setTimeout(() => {
        setLocation("/admin/login");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (username.length < 3) {
      toast({
        title: "Validation Error",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setupMutation.mutate({ username, password });
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Initial Setup</CardTitle>
          <CardDescription>Create your super admin account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This page is only available on first setup. Create your admin credentials to get started.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                minLength={3}
                data-testid="input-setup-username"
              />
              <p className="text-xs text-muted-foreground">
                At least 3 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                minLength={6}
                data-testid="input-setup-password"
              />
              <p className="text-xs text-muted-foreground">
                At least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                minLength={6}
                data-testid="input-setup-confirm-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={setupMutation.isPending}
              data-testid="button-create-admin"
            >
              {setupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {setupMutation.isSuccess && <CheckCircle2 className="mr-2 h-4 w-4" />}
              {setupMutation.isSuccess ? "Created! Redirecting..." : "Create Super Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
