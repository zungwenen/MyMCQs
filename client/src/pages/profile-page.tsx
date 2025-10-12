import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Phone, Trophy, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { QuizAttempt, Payment, Quiz, Subject } from "@shared/schema";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);

  const { data: attempts, isLoading: loadingAttempts } = useQuery<(QuizAttempt & { quiz: Quiz & { subject: Subject } })[]>({
    queryKey: ["/api/quiz-attempts"],
  });

  const { data: payments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments/user"],
  });

  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await apiRequest("PATCH", "/api/users/profile", { name: newName });
      return res;
    },
    onSuccess: (data) => {
      setUser(data.user);
      setIsEditingName(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      toast({
        title: "Success",
        description: "Name updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update name",
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return `₦${(amount / 100).toFixed(2)}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditingName}
                    data-testid="input-profile-name"
                  />
                  {isEditingName ? (
                    <Button
                      onClick={() => updateNameMutation.mutate(name)}
                      disabled={updateNameMutation.isPending}
                      data-testid="button-save-name"
                    >
                      {updateNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  ) : (
                    <Button onClick={() => setIsEditingName(true)} data-testid="button-edit-name">
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm" data-testid="text-phone">
                    {user.phoneNumber}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                {user.isVerified ? (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Verified</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Quiz History
              </CardTitle>
              <CardDescription>Your recent quiz attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAttempts ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : attempts && attempts.length > 0 ? (
                <div className="space-y-3">
                  {attempts.slice(0, 5).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                      data-testid={`attempt-${attempt.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{attempt.quiz.title}</p>
                        <p className="text-sm text-muted-foreground">{attempt.quiz.subject.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(attempt.completedAt || attempt.startedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold font-mono">
                          {Math.round((attempt.score! / attempt.totalQuestions) * 100)}%
                        </p>
                        {attempt.passed ? (
                          <Badge className="bg-success text-success-foreground mt-1">Passed</Badge>
                        ) : (
                          <Badge variant="destructive" className="mt-1">Failed</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No quiz attempts yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
            <CardDescription>Your transaction records</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPayments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    data-testid={`payment-${payment.id}`}
                  >
                    <div>
                      <p className="font-medium">Premium Membership</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ref: {payment.reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatAmount(payment.amount)}</p>
                      <Badge
                        className={
                          payment.status === "success"
                            ? "bg-success text-success-foreground mt-1"
                            : payment.status === "pending"
                            ? "bg-warning text-warning-foreground mt-1"
                            : "mt-1"
                        }
                        variant={payment.status === "failed" ? "destructive" : "default"}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payment history</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
