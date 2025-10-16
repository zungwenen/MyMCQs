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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Plus, Edit, Trash2, ArrowLeft, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Question, Quiz, Scenario } from "@shared/schema";
import { Footer } from "@/components/layout/footer";

type ScenarioWithQuestions = Scenario & {
  questions?: Question[];
};

export default function AdminQuestions() {
  const { quizId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isScenarioQuestionModalOpen, setIsScenarioQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [editingScenarioQuestion, setEditingScenarioQuestion] = useState<Question | null>(null);
  const [scenarioPassage, setScenarioPassage] = useState("");
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

  const { data: questions, isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/admin/questions", quizId],
    enabled: !!quizId,
  });

  const { data: scenarios, isLoading: scenariosLoading } = useQuery<ScenarioWithQuestions[]>({
    queryKey: ["/api/admin/scenarios", quizId],
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
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/questions/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions", quizId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios", quizId] });
      toast({ title: "Success", description: "Question deleted successfully" });
    },
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (data: { passage: string }) => {
      return await apiRequest("POST", `/api/admin/quizzes/${quizId}/scenarios`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios", quizId] });
      setIsScenarioModalOpen(false);
      setScenarioPassage("");
      setEditingScenario(null);
      toast({ title: "Success", description: "Scenario created successfully" });
    },
  });

  const updateScenarioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { passage: string } }) => {
      return await apiRequest("PATCH", `/api/admin/scenarios/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios", quizId] });
      setIsScenarioModalOpen(false);
      setScenarioPassage("");
      setEditingScenario(null);
      toast({ title: "Success", description: "Scenario updated successfully" });
    },
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/scenarios/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios", quizId] });
      toast({ title: "Success", description: "Scenario deleted successfully" });
    },
  });

  const createScenarioQuestionMutation = useMutation({
    mutationFn: async ({ scenarioId, data }: { scenarioId: string; data: any }) => {
      return await apiRequest("POST", `/api/admin/scenarios/${scenarioId}/questions`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios", quizId] });
      setIsScenarioQuestionModalOpen(false);
      resetForm();
      setSelectedScenarioId(null);
      setEditingScenarioQuestion(null);
      toast({ title: "Success", description: "Question added to scenario successfully" });
    },
  });

  const updateScenarioQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/admin/questions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios", quizId] });
      setIsScenarioQuestionModalOpen(false);
      resetForm();
      setSelectedScenarioId(null);
      setEditingScenarioQuestion(null);
      toast({ title: "Success", description: "Scenario question updated successfully" });
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
    setEditingScenarioQuestion(null);
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

  const handleEditScenario = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setScenarioPassage(scenario.passage);
    setIsScenarioModalOpen(true);
  };

  const handleEditScenarioQuestion = (question: Question, scenarioId: string) => {
    setEditingScenarioQuestion(question);
    setSelectedScenarioId(scenarioId);
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
    setIsScenarioQuestionModalOpen(true);
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
        correctAnswer: filteredOptions[0] || "",
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

  const handleScenarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingScenario) {
      updateScenarioMutation.mutate({ id: editingScenario.id, data: { passage: scenarioPassage } });
    } else {
      createScenarioMutation.mutate({ passage: scenarioPassage });
    }
  };

  const handleScenarioQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScenarioId) return;

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
        correctAnswer: filteredOptions[0] || "",
      };
    } else {
      data = {
        ...formData,
        options: formData.options.filter(o => o.trim()),
      };
    }

    if (editingScenarioQuestion) {
      updateScenarioQuestionMutation.mutate({ id: editingScenarioQuestion.id, data });
    } else {
      createScenarioQuestionMutation.mutate({ scenarioId: selectedScenarioId, data });
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

  const regularQuestions = questions?.filter(q => !q.scenarioId) || [];

  if (questionsLoading || scenariosLoading) {
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
          <p className="text-muted-foreground">Manage questions and scenarios for this quiz</p>
        </div>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions" data-testid="tab-questions">Regular Questions</TabsTrigger>
          <TabsTrigger value="scenarios" data-testid="tab-scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsModalOpen(true)} data-testid="button-create-question">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {regularQuestions.map((question, index) => (
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
            {regularQuestions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No questions yet. Add your first question to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setIsScenarioModalOpen(true)} data-testid="button-create-scenario">
              <Plus className="mr-2 h-4 w-4" />
              Add Scenario
            </Button>
          </div>

          <div className="space-y-4">
            {scenarios && scenarios.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {scenarios.map((scenario, index) => (
                  <AccordionItem key={scenario.id} value={scenario.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-semibold">Scenario {index + 1}</span>
                          <span className="text-sm text-muted-foreground">
                            ({scenario.questions?.length || 0} questions)
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">Passage</CardTitle>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditScenario(scenario)}
                                  data-testid={`button-edit-scenario-${scenario.id}`}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteScenarioMutation.mutate(scenario.id)}
                                  disabled={deleteScenarioMutation.isPending}
                                  data-testid={`button-delete-scenario-${scenario.id}`}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{scenario.passage}</p>
                          </CardContent>
                        </Card>

                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">Questions</h4>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedScenarioId(scenario.id);
                              setIsScenarioQuestionModalOpen(true);
                            }}
                            data-testid={`button-add-scenario-question-${scenario.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Question
                          </Button>
                        </div>

                        {scenario.questions && scenario.questions.length > 0 ? (
                          <div className="space-y-3">
                            {scenario.questions.map((question, qIndex) => (
                              <Card key={question.id}>
                                <CardHeader className="pb-2">
                                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm">
                                      Q{qIndex + 1}. {question.questionText}
                                    </CardTitle>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditScenarioQuestion(question, scenario.id)}
                                        data-testid={`button-edit-scenario-question-${question.id}`}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteMutation.mutate(question.id)}
                                        disabled={deleteMutation.isPending}
                                        data-testid={`button-delete-scenario-question-${question.id}`}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <CardDescription className="text-xs">
                                    {question.questionType === "true_false" ? "True/False" : question.questionType === "fill_in_gap" ? "Fill in the Gap" : "Multiple Choice"}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3">
                                  <div className="space-y-1">
                                    {question.questionType === "fill_in_gap" ? (
                                      <ul className="space-y-1">
                                        {(question.options as string[]).map((option, i) => (
                                          <li
                                            key={i}
                                            className={`text-xs p-1.5 rounded ${
                                              i === 0 ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"
                                            }`}
                                          >
                                            {option} {i === 0 && "✓"}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <ul className="space-y-1">
                                        {(question.options as string[]).map((option, i) => (
                                          <li
                                            key={i}
                                            className={`text-xs p-1.5 rounded ${
                                              option === question.correctAnswer ? "bg-success/10 text-success" : "text-muted-foreground"
                                            }`}
                                          >
                                            {option} {option === question.correctAnswer && "✓"}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground">No questions yet. Add your first question.</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No scenarios yet. Add your first scenario to get started.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
                <p className="text-xs text-muted-foreground">Add acceptable answer variations. First one will be the primary answer.</p>
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

      <Dialog open={isScenarioModalOpen} onOpenChange={(open) => { 
        setIsScenarioModalOpen(open); 
        if (!open) { 
          setScenarioPassage(""); 
          setEditingScenario(null);
        } 
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingScenario ? "Edit Scenario" : "Add New Scenario"}</DialogTitle>
            <DialogDescription>
              {editingScenario ? "Update scenario passage" : "Create a scenario with a passage/context"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScenarioSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passage">Passage/Context</Label>
              <Textarea
                id="passage"
                value={scenarioPassage}
                onChange={(e) => setScenarioPassage(e.target.value)}
                required
                rows={8}
                placeholder="Enter the passage or context for this scenario..."
                data-testid="input-scenario-passage"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { 
                  setIsScenarioModalOpen(false); 
                  setScenarioPassage(""); 
                  setEditingScenario(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createScenarioMutation.isPending || updateScenarioMutation.isPending}
                className="flex-1"
                data-testid="button-submit-scenario"
              >
                {(createScenarioMutation.isPending || updateScenarioMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingScenario ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isScenarioQuestionModalOpen} onOpenChange={(open) => { 
        setIsScenarioQuestionModalOpen(open); 
        if (!open) { 
          resetForm(); 
          setSelectedScenarioId(null);
          setEditingScenarioQuestion(null);
        } 
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScenarioQuestion ? "Edit Scenario Question" : "Add Question to Scenario"}</DialogTitle>
            <DialogDescription>
              {editingScenarioQuestion ? "Update scenario question details" : "Create a new question for this scenario"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScenarioQuestionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type</Label>
              <Select
                value={formData.questionType}
                onValueChange={handleQuestionTypeChange}
              >
                <SelectTrigger data-testid="select-scenario-question-type">
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
                data-testid="input-scenario-question-text"
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
                    data-testid={`input-scenario-option-${index}`}
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
                <p className="text-xs text-muted-foreground">Add acceptable answer variations. First one will be the primary answer.</p>
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
                      data-testid={`input-scenario-answer-variation-${index}`}
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
                  <SelectTrigger data-testid="select-scenario-correct-answer">
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
                data-testid="input-scenario-explanation"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { 
                  setIsScenarioQuestionModalOpen(false); 
                  resetForm(); 
                  setSelectedScenarioId(null);
                  setEditingScenarioQuestion(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createScenarioQuestionMutation.isPending || updateScenarioQuestionMutation.isPending}
                className="flex-1"
                data-testid="button-submit-scenario-question"
              >
                {(createScenarioQuestionMutation.isPending || updateScenarioQuestionMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingScenarioQuestion ? "Update" : "Add Question"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
