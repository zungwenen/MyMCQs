import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, List } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Quiz, Subject } from "@shared/schema";

export default function AdminQuizzes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [formData, setFormData] = useState({
    subjectId: "",
    title: "",
    description: "",
    passMarkPercentage: 50,
    timeLimitMinutes: 30,
    instantFeedback: false,
    randomizeQuestions: false,
  });
  const { toast } = useToast();

  const { data: quizzes, isLoading: loadingQuizzes } = useQuery<(Quiz & { subject: Subject })[]>({
    queryKey: ["/api/admin/quizzes"],
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/admin/subjects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/quizzes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Success", description: "Quiz created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiRequest("PATCH", `/api/admin/quizzes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Success", description: "Quiz updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/quizzes/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
      toast({ title: "Success", description: "Quiz deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      subjectId: "",
      title: "",
      description: "",
      passMarkPercentage: 50,
      timeLimitMinutes: 30,
      instantFeedback: false,
      randomizeQuestions: false,
    });
    setEditingQuiz(null);
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      subjectId: quiz.subjectId,
      title: quiz.title,
      description: quiz.description || "",
      passMarkPercentage: quiz.passMarkPercentage,
      timeLimitMinutes: quiz.timeLimitMinutes || 30,
      instantFeedback: quiz.instantFeedback,
      randomizeQuestions: quiz.randomizeQuestions,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuiz) {
      updateMutation.mutate({ id: editingQuiz.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (loadingQuizzes) {
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
          <h1 className="text-3xl font-bold mb-2">Quizzes</h1>
          <p className="text-muted-foreground">Manage quizzes and their settings</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-quiz">
          <Plus className="mr-2 h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      <div className="space-y-4">
        {quizzes?.map((quiz) => (
          <Card key={quiz.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription className="mt-1">{quiz.description}</CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground">Subject: {quiz.subject.name}</span>
                    <span className="text-sm text-muted-foreground">Pass: {quiz.passMarkPercentage}%</span>
                    {quiz.timeLimitMinutes && (
                      <span className="text-sm text-muted-foreground">{quiz.timeLimitMinutes} mins</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/questions/${quiz.id}`}>
                    <Button variant="outline" size="sm" data-testid={`button-manage-questions-${quiz.id}`}>
                      <List className="h-3 w-3 mr-1" />
                      Questions
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(quiz)}
                    data-testid={`button-edit-quiz-${quiz.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(quiz.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-quiz-${quiz.id}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
            <DialogDescription>
              {editingQuiz ? "Update quiz details" : "Add a new quiz to a subject"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                required
              >
                <SelectTrigger data-testid="select-subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                data-testid="input-quiz-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-quiz-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passMarkPercentage">Pass Mark (%)</Label>
                <Input
                  id="passMarkPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passMarkPercentage}
                  onChange={(e) => setFormData({ ...formData, passMarkPercentage: parseInt(e.target.value) })}
                  required
                  data-testid="input-pass-mark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeLimitMinutes">Time Limit (mins)</Label>
                <Input
                  id="timeLimitMinutes"
                  type="number"
                  min="1"
                  value={formData.timeLimitMinutes}
                  onChange={(e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) })}
                  data-testid="input-time-limit"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="instantFeedback" className="cursor-pointer">Instant Feedback</Label>
                <p className="text-sm text-muted-foreground">Show correct answer after each question</p>
              </div>
              <Switch
                id="instantFeedback"
                checked={formData.instantFeedback}
                onCheckedChange={(checked) => setFormData({ ...formData, instantFeedback: checked })}
                data-testid="switch-instant-feedback"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="randomizeQuestions" className="cursor-pointer">Randomize Questions</Label>
                <p className="text-sm text-muted-foreground">Shuffle question order for each attempt</p>
              </div>
              <Switch
                id="randomizeQuestions"
                checked={formData.randomizeQuestions}
                onCheckedChange={(checked) => setFormData({ ...formData, randomizeQuestions: checked })}
                data-testid="switch-randomize"
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
                data-testid="button-submit-quiz"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingQuiz ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
