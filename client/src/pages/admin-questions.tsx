import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Question, Quiz } from "@shared/schema";
import { Footer } from "@/components/layout/footer";

export default function AdminQuestions() {
  const { quizId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    questionText: "",
    questionType: "multiple_choice" as "multiple_choice" | "true_false" | "fill_in_gap",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
  });
  const { toast } = useToast();

  const { data: quiz } = useQuery<Quiz>({
    queryKey: ["/api/admin/quizzes", quizId],
  });

  const { data: questions, isLoading } = useQuery<Question[]>({
    queryKey: ["/api/admin/questions", quizId],
    enabled: !!quizId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/admin/quizzes/${quizId}/questions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions", quizId] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Success", description: "Question created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/admin/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions", quizId] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Success", description: "Question updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/questions/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions", quizId] });
      toast({ title: "Success", description: "Question deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      questionText: "",
      questionType: "multiple_choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
    });
    setEditingQuestion(null);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    const options = question.options as string[];
    setFormData({
      questionText: question.questionText,
      questionType: question.questionType as any,
      options: question.questionType === "true_false" 
        ? ["True", "False"] 
        : question.questionType === "fill_in_gap"
        ? options
        : options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let data: any;
    if (formData.questionType === "true_false") {
      data = {
        ...formData,
        options: ["True", "False"],
      };
    } else if (formData.questionType === "fill_in_gap") {
      const filteredOptions = formData.options.filter(o => o.trim());
      data = {
        ...formData,
        options: filteredOptions,
        correctAnswer: filteredOptions[0] || "", // Primary answer is first variation
      };
    } else {
      data = {
        ...formData,
        options: formData.options.filter(o => o.trim()),
      };
    }
    
    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleQuestionTypeChange = (type: string) => {
    setFormData({
      ...formData,
      questionType: type as any,
      options: type === "true_false" ? ["True", "False"] : type === "fill_in_gap" ? [""] : ["", "", "", ""],
      correctAnswer: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">{quiz?.title || "Quiz Questions"}</h1>
          <p className="text-muted-foreground">Manage questions for this quiz</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-question">
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      <div className="space-y-4">
        {questions?.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {index + 1}. {question.questionText}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Type: {question.questionType === "true_false" ? "True/False" : question.questionType === "fill_in_gap" ? "Fill in the Gap" : "Multiple Choice"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(question)}
                    data-testid={`button-edit-question-${question.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(question.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-question-${question.id}`}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {question.questionType === "fill_in_gap" ? (
                  <>
                    <p className="text-sm font-medium">Acceptable Answers:</p>
                    <ul className="space-y-1">
                      {(question.options as string[]).map((option, i) => (
                        <li
                          key={i}
                          className={`text-sm p-2 rounded ${
                            i === 0 ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {option} {i === 0 && "✓ (Primary)"}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">Options:</p>
                    <ul className="space-y-1">
                      {(question.options as string[]).map((option, i) => (
                        <li
                          key={i}
                          className={`text-sm p-2 rounded ${
                            option === question.correctAnswer ? "bg-success/10 text-success" : "text-muted-foreground"
                          }`}
                        >
                          {option} {option === question.correctAnswer && "✓"}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {questions?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No questions yet. Add your first question to get started.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
            <DialogDescription>
              {editingQuestion ? "Update question details" : "Create a new quiz question"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <Select
                value={formData.questionType}
                onValueChange={handleQuestionTypeChange}
              >
                <SelectTrigger data-testid="select-question-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="fill_in_gap">Fill in the Gap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="questionText">Question</Label>
              <Textarea
                id="questionText"
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                required
                rows={3}
                data-testid="input-question-text"
              />
            </div>
            
            {formData.questionType === "multiple_choice" ? (
              <div className="space-y-2">
                <Label>Options (minimum 2)</Label>
                {formData.options.map((option, index) => (
                  <Input
                    key={index}
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options];
                      newOptions[index] = e.target.value;
                      setFormData({ ...formData, options: newOptions });
                    }}
                    data-testid={`input-option-${index}`}
                  />
                ))}
              </div>
            ) : formData.questionType === "true_false" ? (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Options: True, False (automatically set)</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Correct Answer & Acceptable Variations</Label>
                <p className="text-xs text-muted-foreground">Add acceptable answer variations (e.g., different spellings, formats). First one will be the primary answer.</p>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={index === 0 ? "Primary correct answer" : `Variation ${index}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      data-testid={`input-answer-variation-${index}`}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newOptions = formData.options.filter((_, i) => i !== index);
                          setFormData({ ...formData, options: newOptions });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, options: [...formData.options, ""] })}
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Variation
                </Button>
              </div>
            )}

            {formData.questionType !== "fill_in_gap" && (
              <div className="space-y-2">
                <Label htmlFor="correctAnswer">Correct Answer</Label>
                <Select
                  value={formData.correctAnswer}
                  onValueChange={(value) => setFormData({ ...formData, correctAnswer: value })}
                  required
                >
                  <SelectTrigger data-testid="select-correct-answer">
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.questionType === "true_false" ? ["True", "False"] : formData.options.filter(o => o.trim())).map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                rows={2}
                data-testid="input-explanation"
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
                data-testid="button-submit-question"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingQuestion ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
