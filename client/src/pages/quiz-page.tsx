import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { QuestionCard } from "@/components/quiz/question-card";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { useQuizStore } from "@/store/quiz";
import { useTTS } from "@/hooks/use-tts";
import { Loader2, ChevronRight, Send, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Quiz, Question, Subject, Scenario } from "@shared/schema";
import { Footer } from "@/components/layout/footer";

type QuizWithScenarios = Quiz & { 
  subject: Subject; 
  questions: Question[];
  scenarios?: (Scenario & { questions?: Question[] })[];
};

export default function QuizPage() {
  const { quizId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    setAnswer,
    markedForReview,
    toggleMarkForReview,
    startQuiz,
    resetQuiz,
    getTimeSpent,
  } = useQuizStore();

  const [timeRemaining, setTimeRemaining] = useState<number | undefined>();

  const { data: quiz, isLoading } = useQuery<QuizWithScenarios>({
    queryKey: ["/api/quizzes", quizId],
    enabled: !!quizId,
  });

  // Flatten all questions: scenario questions first, then regular questions
  const allQuestions: (Question & { scenarioPassage?: string })[] = [];

  if (quiz) {
    // Add scenario questions with their passages
    quiz.scenarios?.forEach(scenario => {
      scenario.questions?.forEach(question => {
        allQuestions.push({
          ...question,
          scenarioPassage: scenario.passage
        });
      });
    });

    // Add regular questions (those without scenarioId)
    quiz.questions?.filter(q => !q.scenarioId).forEach(question => {
      allQuestions.push(question);
    });
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const totalQuestions = allQuestions.length;

  const { speak, stop, isSpeaking } = useTTS();

  useEffect(() => {
    if (quiz && !getTimeSpent()) {
      startQuiz();
    }
  }, [quiz]);

  useEffect(() => {
    if (!quiz?.timeLimitMinutes) return;

    const totalSeconds = quiz.timeLimitMinutes * 60;
    const elapsed = getTimeSpent();
    const remaining = totalSeconds - elapsed;

    if (remaining <= 0) {
      handleSubmitQuiz();
      return;
    }

    setTimeRemaining(remaining);

    const interval = setInterval(() => {
      const newElapsed = getTimeSpent();
      const newRemaining = totalSeconds - newElapsed;

      if (newRemaining <= 0) {
        handleSubmitQuiz();
        clearInterval(interval);
      } else {
        setTimeRemaining(newRemaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [quiz, currentQuestionIndex]);

  const submitMutation = useMutation({
    mutationFn: async (data: { answers: Record<string, string>; markedForReview: string[]; timeSpentSeconds: number }) => {
      return await apiRequest("POST", `/api/quizzes/${quizId}/submit`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      resetQuiz();
      setLocation(`/results/${data.attemptId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      stop();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      stop();
    }
  };

  const handleSubmitQuiz = () => {
    const timeSpentSeconds = getTimeSpent();
    submitMutation.mutate({
      answers,
      markedForReview,
      timeSpentSeconds,
    });
  };

  const handleSpeak = () => {
    if (!currentQuestion) return;

    let textToSpeak = currentQuestion.questionText;

    // Add scenario passage if present
    if (currentQuestion.scenarioPassage) {
      textToSpeak = `Passage: ${currentQuestion.scenarioPassage}. Question: ${textToSpeak}`;
    }

    if (currentQuestion.questionType !== "fill_in_gap") {
      const options = currentQuestion.options as string[];
      textToSpeak += `. Options: ${options.join(", ")}`;
    }

    speak(textToSpeak);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    );
  }

  const themeColor = quiz.subject.themeColor;
  const selectedAnswer = answers[currentQuestion.id];
  const isMarked = markedForReview.includes(currentQuestion.id);

  // Group questions by scenario for the sidebar
  const groupedQuestions: { type: 'scenario' | 'regular', title?: string, passage?: string, questions: (Question & { globalIndex: number })[] }[] = [];
  let globalIndex = 0;

  quiz.scenarios?.forEach((scenario, scenarioIndex) => {
    if (scenario.questions && scenario.questions.length > 0) {
      groupedQuestions.push({
        type: 'scenario',
        title: `Scenario ${scenarioIndex + 1}`,
        passage: scenario.passage,
        questions: scenario.questions.map(q => ({ ...q, globalIndex: globalIndex++ }))
      });
    }
  });

  const regularQuestions = quiz.questions?.filter(q => !q.scenarioId) || [];
  if (regularQuestions.length > 0) {
    groupedQuestions.push({
      type: 'regular',
      questions: regularQuestions.map(q => ({ ...q, globalIndex: globalIndex++ }))
    });
  }

  return (
    <div className="min-h-screen pb-20">
      <QuizProgress
        currentQuestion={currentQuestionIndex}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining}
        timeLimitMinutes={quiz.timeLimitMinutes || undefined}
        themeColor={themeColor}
      />

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            {currentQuestion.scenarioPassage && (
              <Card className="border-2" style={{ borderColor: `hsl(${themeColor} / 0.3)` }}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <FileText className="h-5 w-5 mt-1 shrink-0" style={{ color: `hsl(${themeColor})` }} />
                    <h3 className="font-semibold text-lg">Passage</h3>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {currentQuestion.scenarioPassage}
                  </p>
                </CardContent>
              </Card>
            )}

            <QuestionCard
              question={currentQuestion}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={(answer) => setAnswer(currentQuestion.id, answer)}
              showFeedback={quiz.instantFeedback && !!selectedAnswer}
              isMarkedForReview={isMarked}
              onToggleMarkForReview={() => toggleMarkForReview(currentQuestion.id)}
              themeColor={themeColor}
              isSpeaking={isSpeaking}
              onSpeak={handleSpeak}
              onStopSpeaking={stop}
              questionNumber={currentQuestionIndex + 1}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex-1"
              >
                Previous
              </Button>
              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1"
                  style={{ backgroundColor: `hsl(${themeColor})` }}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={submitMutation.isPending}
                  className="flex-1"
                  style={{ backgroundColor: `hsl(${themeColor})` }}
                  data-testid="button-submit-quiz"
                >
                  {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Quiz
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Questions Overview</h3>
                <Accordion type="single" collapsible className="w-full">
                  {groupedQuestions.map((group, groupIndex) => (
                    <AccordionItem key={groupIndex} value={`group-${groupIndex}`}>
                      <AccordionTrigger className="text-sm py-2">
                        {group.type === 'scenario' ? group.title : 'Regular Questions'}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({group.questions.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-5 gap-2 pt-2">
                          {group.questions.map((q) => {
                            const isAnswered = !!answers[q.id];
                            const isCurrentQuestion = q.globalIndex === currentQuestionIndex;
                            const isMarkedQuestion = markedForReview.includes(q.id);

                            return (
                              <button
                                key={q.id}
                                onClick={() => setCurrentQuestionIndex(q.globalIndex)}
                                className={`
                                  aspect-square rounded-lg text-sm font-medium transition-all
                                  ${isCurrentQuestion ? 'ring-2 ring-offset-2' : ''}
                                  ${isAnswered ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}
                                  ${isMarkedQuestion ? 'ring-2 ring-warning' : ''}
                                `}
                                style={
                                  isCurrentQuestion
                                    ? { ringColor: `hsl(${themeColor})` }
                                    : {}
                                }
                              >
                                {q.globalIndex + 1}
                              </button>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-success/20" />
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted" />
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded ring-2 ring-warning" />
                    <span>Marked for Review</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}