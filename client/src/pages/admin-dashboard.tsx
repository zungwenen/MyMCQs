import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import type { QuizAttempt, Payment } from "@shared/schema";
import { Footer } from "@/components/layout/footer";

export default function AdminDashboard() {
  const { data: attempts, isLoading: loadingAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/admin/attempts"],
  });

  const { data: payments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const totalAttempts = attempts?.length || 0;
  const passedAttempts = attempts?.filter((a) => a.passed).length || 0;
  const averageScore = attempts?.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score! / a.totalQuestions) * 100, 0) / attempts.length)
    : 0;
  const totalRevenue = payments?.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0) || 0;

  if (loadingAttempts || loadingPayments) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of quiz performance and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-total-attempts">{totalAttempts}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-pass-rate">
              {totalAttempts ? Math.round((passedAttempts / totalAttempts) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">{passedAttempts} passed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-avg-score">{averageScore}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="stat-revenue">
              ₦{(totalRevenue / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attempts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attempts">Recent Attempts</TabsTrigger>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Quiz Attempts</CardTitle>
              <CardDescription>Latest quiz attempts from users</CardDescription>
            </CardHeader>
            <CardContent>
              {attempts && attempts.length > 0 ? (
                <div className="space-y-3">
                  {attempts.slice(0, 10).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {new Date(attempt.completedAt || attempt.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{Math.round((attempt.score! / attempt.totalQuestions) * 100)}%</p>
                        <p className="text-xs text-muted-foreground">{attempt.passed ? "Passed" : "Failed"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No attempts yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.slice(0, 10).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1">
                        <p className="font-medium">₦{(payment.amount / 100).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        payment.status === "success" ? "bg-success/10 text-success" :
                        payment.status === "pending" ? "bg-warning/10 text-warning" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {payment.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No payments yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Footer />
    </div>
  );
}
