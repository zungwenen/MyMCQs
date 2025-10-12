import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, DollarSign, UserPlus, Shield, Brain, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth";
import type { PaymentSettings, Admin, IqGrade, Subject } from "@shared/schema";
import { Footer } from "@/components/layout/footer";

type IqGradeWithSubject = IqGrade & { subject?: Subject | null };

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
  const [iqGradeFormData, setIqGradeFormData] = useState({
    id: "",
    subjectId: null as string | null,
    minScorePercentage: 0,
    maxScorePercentage: 100,
    minIQ: 70,
    maxIQ: 130,
    label: "",
  });
  const [editingIqGrade, setEditingIqGrade] = useState<string | null>(null);

  const { data: paymentSettings, isLoading: loadingSettings } = useQuery<PaymentSettings>({
    queryKey: ["/api/payment-settings"],
  });

  useEffect(() => {
    if (paymentSettings) {
      setPaymentFormData({
        membershipPrice: paymentSettings.membershipPrice,
        paystackSplitCode: paymentSettings.paystackSplitCode || "",
      });
    }
  }, [paymentSettings]);

  const { data: admins, isLoading: loadingAdmins } = useQuery<Admin[]>({
    queryKey: ["/api/admin/admins"],
    enabled: admin?.isSuperAdmin,
  });

  const { data: iqGrades, isLoading: loadingIqGrades } = useQuery<IqGradeWithSubject[]>({
    queryKey: ["/api/admin/iq-grades"],
  });

  const { data: subjects, isLoading: loadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/admin/subjects"],
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

  const createIqGradeMutation = useMutation({
    mutationFn: async (data: typeof iqGradeFormData) => {
      const { id, ...payload } = data;
      return await apiRequest("POST", "/api/admin/iq-grades", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/iq-grades"] });
      resetIqGradeForm();
      toast({ title: "Success", description: "IQ grade created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateIqGradeMutation = useMutation({
    mutationFn: async (data: typeof iqGradeFormData) => {
      const { id, ...payload } = data;
      return await apiRequest("PATCH", `/api/admin/iq-grades/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/iq-grades"] });
      resetIqGradeForm();
      toast({ title: "Success", description: "IQ grade updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteIqGradeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/iq-grades/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/iq-grades"] });
      toast({ title: "Success", description: "IQ grade deleted successfully" });
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

  const handleIqGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ranges
    if (iqGradeFormData.minScorePercentage >= iqGradeFormData.maxScorePercentage) {
      toast({ 
        title: "Validation Error", 
        description: "Min score percentage must be less than max score percentage",
        variant: "destructive" 
      });
      return;
    }
    
    if (iqGradeFormData.minIQ >= iqGradeFormData.maxIQ) {
      toast({ 
        title: "Validation Error", 
        description: "Min IQ must be less than max IQ",
        variant: "destructive" 
      });
      return;
    }
    
    if (editingIqGrade) {
      updateIqGradeMutation.mutate(iqGradeFormData);
    } else {
      createIqGradeMutation.mutate(iqGradeFormData);
    }
  };

  const resetIqGradeForm = () => {
    setIqGradeFormData({
      id: "",
      subjectId: null,
      minScorePercentage: 0,
      maxScorePercentage: 100,
      minIQ: 70,
      maxIQ: 130,
      label: "",
    });
    setEditingIqGrade(null);
  };

  const handleEditIqGrade = (grade: IqGradeWithSubject) => {
    setIqGradeFormData({
      id: grade.id,
      subjectId: grade.subjectId || null,
      minScorePercentage: grade.minScorePercentage,
      maxScorePercentage: grade.maxScorePercentage,
      minIQ: grade.minIQ,
      maxIQ: grade.maxIQ,
      label: grade.label,
    });
    setEditingIqGrade(grade.id);
  };

  if (loadingSettings || loadingAdmins || loadingIqGrades || loadingSubjects) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage payment, admin, and IQ grade settings</p>
      </div>

      <Tabs defaultValue="payment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payment">Payment Settings</TabsTrigger>
          {admin?.isSuperAdmin && <TabsTrigger value="admins">Admin Management</TabsTrigger>}
          <TabsTrigger value="iq-grades">IQ Grades</TabsTrigger>
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

        <TabsContent value="iq-grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {editingIqGrade ? "Edit IQ Grade" : "Create IQ Grade"}
              </CardTitle>
              <CardDescription>
                Configure IQ assessment ranges for quiz scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIqGradeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={iqGradeFormData.subjectId || "global"}
                    onValueChange={(value) =>
                      setIqGradeFormData({
                        ...iqGradeFormData,
                        subjectId: value === "global" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-iq-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (All Subjects)</SelectItem>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose a specific subject or Global to apply to all subjects
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minScorePercentage">Min Score %</Label>
                    <Input
                      id="minScorePercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={iqGradeFormData.minScorePercentage}
                      onChange={(e) =>
                        setIqGradeFormData({
                          ...iqGradeFormData,
                          minScorePercentage: parseInt(e.target.value),
                        })
                      }
                      required
                      data-testid="input-min-score-percentage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxScorePercentage">Max Score %</Label>
                    <Input
                      id="maxScorePercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={iqGradeFormData.maxScorePercentage}
                      onChange={(e) =>
                        setIqGradeFormData({
                          ...iqGradeFormData,
                          maxScorePercentage: parseInt(e.target.value),
                        })
                      }
                      required
                      data-testid="input-max-score-percentage"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minIQ">Min IQ</Label>
                    <Input
                      id="minIQ"
                      type="number"
                      value={iqGradeFormData.minIQ}
                      onChange={(e) =>
                        setIqGradeFormData({
                          ...iqGradeFormData,
                          minIQ: parseInt(e.target.value),
                        })
                      }
                      required
                      data-testid="input-min-iq"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxIQ">Max IQ</Label>
                    <Input
                      id="maxIQ"
                      type="number"
                      value={iqGradeFormData.maxIQ}
                      onChange={(e) =>
                        setIqGradeFormData({
                          ...iqGradeFormData,
                          maxIQ: parseInt(e.target.value),
                        })
                      }
                      required
                      data-testid="input-max-iq"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    type="text"
                    value={iqGradeFormData.label}
                    onChange={(e) =>
                      setIqGradeFormData({ ...iqGradeFormData, label: e.target.value })
                    }
                    placeholder="e.g., Genius, Above Average, etc."
                    required
                    data-testid="input-iq-label"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createIqGradeMutation.isPending || updateIqGradeMutation.isPending}
                    data-testid="button-save-iq-grade"
                  >
                    {(createIqGradeMutation.isPending || updateIqGradeMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingIqGrade ? "Update" : "Create"} IQ Grade
                  </Button>
                  {editingIqGrade && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetIqGradeForm}
                      data-testid="button-cancel-edit-iq-grade"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                IQ Grades List
              </CardTitle>
              <CardDescription>Manage IQ assessment ranges</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingIqGrades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : iqGrades && iqGrades.length > 0 ? (
                <div className="space-y-3">
                  {iqGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`iq-grade-${grade.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{grade.label}</p>
                          <span className="text-sm text-muted-foreground">
                            ({grade.subject?.name || "Global"})
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Score: {grade.minScorePercentage}% - {grade.maxScorePercentage}% → IQ: {grade.minIQ} - {grade.maxIQ}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditIqGrade(grade)}
                          data-testid={`button-edit-iq-grade-${grade.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteIqGradeMutation.mutate(grade.id)}
                          disabled={deleteIqGradeMutation.isPending}
                          data-testid={`button-delete-iq-grade-${grade.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No IQ grades configured yet. Create one above.
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
