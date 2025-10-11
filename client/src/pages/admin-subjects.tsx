import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, Crown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Subject } from "@shared/schema";

const THEME_COLORS = [
  { name: "Blue", value: "217 91% 60%" },
  { name: "Green", value: "142 71% 45%" },
  { name: "Purple", value: "262 83% 58%" },
  { name: "Orange", value: "24 95% 53%" },
  { name: "Pink", value: "330 81% 60%" },
  { name: "Teal", value: "173 80% 40%" },
];

export default function AdminSubjects() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPremium: false,
    themeColor: THEME_COLORS[0].value,
  });
  const { toast } = useToast();

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/admin/subjects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/subjects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Success", description: "Subject created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiRequest("PATCH", `/api/admin/subjects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Success", description: "Subject updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/subjects/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Success", description: "Subject deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isPremium: false,
      themeColor: THEME_COLORS[0].value,
    });
    setEditingSubject(null);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || "",
      isPremium: subject.isPremium,
      themeColor: subject.themeColor,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subjects</h1>
          <p className="text-muted-foreground">Manage quiz subjects and categories</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-subject">
          <Plus className="mr-2 h-4 w-4" />
          Create Subject
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects?.map((subject) => (
          <Card key={subject.id} style={{ borderLeftColor: `hsl(${subject.themeColor})`, borderLeftWidth: '4px' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{subject.name}</span>
                {subject.isPremium && <Crown className="h-4 w-4 text-premium" />}
              </CardTitle>
              <CardDescription>{subject.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(subject)}
                data-testid={`button-edit-subject-${subject.id}`}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(subject.id)}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-subject-${subject.id}`}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Create New Subject"}</DialogTitle>
            <DialogDescription>
              {editingSubject ? "Update subject details" : "Add a new quiz subject"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-subject-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-subject-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="grid grid-cols-3 gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, themeColor: color.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.themeColor === color.value ? "border-primary" : "border-border"
                    }`}
                    style={{ backgroundColor: `hsl(${color.value} / 0.2)` }}
                    data-testid={`color-${color.name.toLowerCase()}`}
                  >
                    <div
                      className="w-full h-8 rounded"
                      style={{ backgroundColor: `hsl(${color.value})` }}
                    />
                    <p className="text-xs mt-2 text-center">{color.name}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="isPremium" className="cursor-pointer">Premium Subject</Label>
                <p className="text-sm text-muted-foreground">Requires payment to access</p>
              </div>
              <Switch
                id="isPremium"
                checked={formData.isPremium}
                onCheckedChange={(checked) => setFormData({ ...formData, isPremium: checked })}
                data-testid="switch-is-premium"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
                data-testid="button-submit-subject"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingSubject ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
