import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, UserPlus, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";
import type { PaymentSettings, Admin } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  const { admin } = useAuthStore();
  const [paymentFormData, setPaymentFormData] = useState({
    membershipPrice: 5000,
    paystackSplitCode: "",
  });
  const [adminFormData, setAdminFormData] = useState({
    username: "",
    password: "",
  });

  const { data: paymentSettings, isLoading: loadingSettings } = useQuery<PaymentSettings>({
    queryKey: ["/api/payment-settings"],
    onSuccess: (data) => {
      setPaymentFormData({
        membershipPrice: data.membershipPrice,
        paystackSplitCode: data.paystackSplitCode || "",
      });
    },
  });

  const { data: admins, isLoading: loadingAdmins } = useQuery<Admin[]>({
    queryKey: ["/api/admin/admins"],
    enabled: admin?.isSuperAdmin,
  });

  const updatePaymentSettingsMutation = useMutation({
    mutationFn: async (data: typeof paymentFormData) => {
      return await apiRequest("PATCH", "/api/admin/payment-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
      toast({ title: "Success", description: "Payment settings updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: typeof adminFormData) => {
      return await apiRequest("POST", "/api/admin/create-admin", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      setAdminFormData({ username: "", password: "" });
      toast({ title: "Success", description: "Admin created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/admins/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "Success", description: "Admin deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentSettingsMutation.mutate(paymentFormData);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminMutation.mutate(adminFormData);
  };

  if (loadingSettings || loadingAdmins) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage payment and admin settings</p>
      </div>

      <Tabs defaultValue="payment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payment">Payment Settings</TabsTrigger>
          {admin?.isSuperAdmin && <TabsTrigger value="admins">Admin Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Paystack Configuration
              </CardTitle>
              <CardDescription>
                Configure payment settings for premium membership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="membershipPrice">Membership Price (in kobo)</Label>
                  <Input
                    id="membershipPrice"
                    type="number"
                    value={paymentFormData.membershipPrice}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, membershipPrice: parseInt(e.target.value) })}
                    required
                    data-testid="input-membership-price"
                  />
                  <p className="text-sm text-muted-foreground">
                    Current price: ₦{(paymentFormData.membershipPrice / 100).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paystackSplitCode">Paystack Split Code (Optional)</Label>
                  <Input
                    id="paystackSplitCode"
                    type="text"
                    value={paymentFormData.paystackSplitCode}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paystackSplitCode: e.target.value })}
                    placeholder="SPL_xxxxxxxxx"
                    data-testid="input-split-code"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your Paystack split code for revenue sharing
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={updatePaymentSettingsMutation.isPending}
                  data-testid="button-save-payment-settings"
                >
                  {updatePaymentSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {admin?.isSuperAdmin && (
          <TabsContent value="admins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create New Admin
                </CardTitle>
                <CardDescription>Add administrators who can manage quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminUsername">Username</Label>
                    <Input
                      id="adminUsername"
                      type="text"
                      value={adminFormData.username}
                      onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                      required
                      data-testid="input-new-admin-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminFormData.password}
                      onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                      required
                      data-testid="input-new-admin-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createAdminMutation.isPending}
                    data-testid="button-create-admin"
                  >
                    {createAdminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Admin
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Users
                </CardTitle>
                <CardDescription>Manage administrator accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {admins?.map((adminUser) => (
                    <div
                      key={adminUser.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`admin-${adminUser.id}`}
                    >
                      <div>
                        <p className="font-medium">{adminUser.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {adminUser.isSuperAdmin ? "Super Admin" : "Admin"}
                        </p>
                      </div>
                      {!adminUser.isSuperAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAdminMutation.mutate(adminUser.id)}
                          disabled={deleteAdminMutation.isPending}
                          data-testid={`button-delete-admin-${adminUser.id}`}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
