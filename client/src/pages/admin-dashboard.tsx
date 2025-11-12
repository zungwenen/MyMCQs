import { useState } from "react";
import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BookOpen, Users, DollarSign, TrendingUp, Loader2, CheckCircle, XCircle, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import type { QuizAttempt, Payment } from "@shared/schema";
import { Footer } from "@/components/layout/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PaymentResponse {
  items: any[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
  statusCounts: {
    pending: number;
    success: number;
    failed: number;
  };
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  const { data: attempts, isLoading: loadingAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/admin/attempts"],
  });

  const { data: globalPaymentStats } = useQuery<PaymentResponse>({
    queryKey: ["/api/admin/payments", { limit: 1 }],
    queryFn: async () => {
      const response = await fetch(`/api/admin/payments?limit=1`);
      if (!response.ok) throw new Error("Failed to fetch payment stats");
      return response.json();
    },
  });

  const paymentsQuery = useInfiniteQuery<PaymentResponse>({
    queryKey: ["/api/admin/payments", { 
      status: statusFilter, 
      from: dateFrom?.toISOString(), 
      to: dateTo?.toISOString(),
      limit: 20 
    }],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append("limit", "20");
      if (pageParam) params.append("cursor", pageParam as string);
      if (statusFilter) params.append("status", statusFilter);
      if (dateFrom) params.append("from", dateFrom.toISOString());
      if (dateTo) params.append("to", dateTo.toISOString());
      
      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: undefined,
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/admin/payments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/user"] });
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
  });

  const totalAttempts = attempts?.length || 0;
  const passedAttempts = attempts?.filter((a) => a.passed).length || 0;
  const averageScore = attempts?.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.score! / a.totalQuestions) * 100, 0) / attempts.length)
    : 0;

  const globalRevenue = globalPaymentStats?.totalRevenue || 0;
  
  const firstPage = paymentsQuery.data?.pages[0];
  const allPayments = paymentsQuery.data?.pages.flatMap(page => page.items) || [];
  const paymentStats = firstPage?.statusCounts || { pending: 0, success: 0, failed: 0 };
  const totalCount = firstPage?.totalCount || 0;

  const clearFilters = () => {
    setStatusFilter(null);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = statusFilter !== null || dateFrom !== undefined || dateTo !== undefined;

  if (loadingAttempts || paymentsQuery.isLoading) {
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
              ₦{(globalRevenue / 100).toFixed(2)}
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
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>Payment Management</CardTitle>
                <CardDescription>View and manage all payment transactions</CardDescription>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 sticky top-0 bg-card z-10 py-2">
                <div className="flex-1">
                  <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal" data-testid="button-date-from">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal" data-testid="button-date-to">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} data-testid="button-clear-filters">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-xl font-bold" data-testid="stat-total-payments">{totalCount}</p>
                </div>
                <div className="p-3 rounded-lg border bg-warning/10">
                  <p className="text-xs text-muted-foreground mb-1">Pending</p>
                  <p className="text-xl font-bold text-warning" data-testid="stat-pending-payments">{paymentStats.pending}</p>
                </div>
                <div className="p-3 rounded-lg border bg-success/10">
                  <p className="text-xs text-muted-foreground mb-1">Success</p>
                  <p className="text-xl font-bold text-success" data-testid="stat-success-payments">{paymentStats.success}</p>
                </div>
                <div className="p-3 rounded-lg border bg-destructive/10">
                  <p className="text-xs text-muted-foreground mb-1">Failed</p>
                  <p className="text-xl font-bold text-destructive" data-testid="stat-failed-payments">{paymentStats.failed}</p>
                </div>
              </div>
              {hasActiveFilters && (
                <p className="text-xs text-muted-foreground">Stats reflect current filters</p>
              )}
            </CardHeader>
            
            <CardContent>
              {paymentsQuery.isError ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">Failed to load payments</p>
                  <Button onClick={() => paymentsQuery.refetch()} variant="outline" data-testid="button-retry">
                    Retry
                  </Button>
                </div>
              ) : allPayments.length > 0 ? (
                <div className="space-y-3">
                  {allPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">₦{(payment.amount / 100).toFixed(2)}</p>
                          <div className={`px-2 py-0.5 rounded text-xs ${
                            payment.status === "success" ? "bg-success/10 text-success" :
                            payment.status === "pending" ? "bg-warning/10 text-warning" :
                            "bg-destructive/10 text-destructive"
                          }`}>
                            {payment.status}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {payment.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.user?.phoneNumber || "No phone"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                      </div>
                      {payment.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updatePaymentMutation.mutate({ id: payment.id, status: "success" })}
                            disabled={updatePaymentMutation.isPending}
                            data-testid={`button-approve-${payment.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updatePaymentMutation.mutate({ id: payment.id, status: "failed" })}
                            disabled={updatePaymentMutation.isPending}
                            data-testid={`button-reject-${payment.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {paymentsQuery.hasNextPage && (
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={() => paymentsQuery.fetchNextPage()}
                        disabled={paymentsQuery.isFetchingNextPage}
                        variant="outline"
                        data-testid="button-load-more"
                      >
                        {paymentsQuery.isFetchingNextPage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {hasActiveFilters ? "No payments match your filters" : "No payments yet"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Footer />
    </div>
  );
}
