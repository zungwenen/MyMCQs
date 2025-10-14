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

// Group questions: scenarios come first, then individual questions
type QuestionGroup = {
  type: 'scenario';
  scenario: Scenario;
  questions: Question[];
} | {
  type: 'single';
  question: Question;
};

export default function QuizPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { speak, stop, isSpeaking } = useTTS();
  
  const {
    currentQuestionIndex,
    answers,
    markedForReview,
    setCurrentQuestionIndex,
    setAnswer,
    toggleMarkForReview,
    startQuiz,
    resetQuiz,
    getTimeSpent,
  } = useQuizStore();

  const [timeRemaining, setTimeRemaining] = useState<number | undefined>();

  const { data: quiz, isLoading: loadingQuiz } = useQuery<QuizWithScenarios>({
    queryKey: ["/api/quizzes", id],
  });

  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/quizzes/${id}/submit`, {
        answers,
        markedForReview,
        timeSpentSeconds: getTimeSpent(),
      });
      return res;
    },
    onSuccess: (data) => {
      resetQuiz();
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      setLocation(`/results/${data.attemptId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (quiz && !timeRemaining) {
      startQuiz();
      if (quiz.timeLimitMinutes) {
        setTimeRemaining(quiz.timeLimitMinutes * 60);
      }
    }
  }, [quiz]);

  useEffect(() => {
    if (timeRemaining === undefined || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === undefined || prev <= 1) {
          clearInterval(timer);
          submitQuizMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  if (loadingQuiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    );
  }

  // Group questions by scenario or as individual questions
  const questionGroups: QuestionGroup[] = [];
  const processedScenarios = new Set<string>();
  
  quiz.questions.forEach((question) => {
    if (question.scenarioId && !processedScenarios.has(question.scenarioId)) {
      // Find scenario and all its questions
      const scenario = quiz.scenarios?.find(s => s.id === question.scenarioId);
      if (scenario) {
        const scenarioQuestions = quiz.questions.filter(q => q.scenarioId === question.scenarioId);
        questionGroups.push({
          type: 'scenario',
          scenario,
          questions: scenarioQuestions,
        });
        processedScenarios.add(question.scenarioId);
      } else {
        // Fallback: Scenario object missing, treat as individual question
        questionGroups.push({
          type: 'single',
          question,
        });
      }
    } else if (!question.scenarioId) {
      // Individual question
      questionGroups.push({
        type: 'single',
        question,
      });
    }
  });

  const currentGroup = questionGroups[currentQuestionIndex];
  const isLastGroup = currentQuestionIndex === questionGroups.length - 1;

  // Check if current group has all answers
  let hasAllAnswers = false;
  if (currentGroup.type === 'scenario') {
    hasAllAnswers = currentGroup.questions.every(q => !!answers[q.id]);
  } else {
    hasAllAnswers = !!answers[currentGroup.question.id];
  }

  const handleNext = () => {
    if (isLastGroup) {
      submitQuizMutation.mutate();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-24">
      <QuizProgress
        currentQuestion={currentQuestionIndex}
        totalQuestions={questionGroups.length}
        timeRemaining={timeRemaining}
        timeLimitMinutes={quiz.timeLimitMinutes || undefined}
        themeColor={quiz.subject.themeColor}
      />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8 space-y-4">
        {currentGroup.type === 'scenario' ? (
          <div className="space-y-4">
            <Accordion type="single" collapsible defaultValue="scenario" className="w-full">
              <AccordionItem value="scenario">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" style={{ color: `hsl(${quiz.subject.themeColor})` }} />
                    <span className="font-semibold">Read this scenario and answer the questions that follow.</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{currentGroup.scenario.passage}</p>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-4">
              {currentGroup.questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  selectedAnswer={answers[question.id]}
                  onSelectAnswer={(answer) => setAnswer(question.id, answer)}
                  showFeedback={quiz.instantFeedback && !!answers[question.id]}
                  isMarkedForReview={markedForReview.includes(question.id)}
                  onToggleMarkForReview={() => toggleMarkForReview(question.id)}
                  themeColor={quiz.subject.themeColor}
                  isSpeaking={isSpeaking}
                  onSpeak={() => speak(question.questionText)}
                  onStopSpeaking={stop}
                  questionNumber={index + 1}
                />
              ))}
            </div>
          </div>
        ) : (
          <QuestionCard
            question={currentGroup.question}
            selectedAnswer={answers[currentGroup.question.id]}
            onSelectAnswer={(answer) => setAnswer(currentGroup.question.id, answer)}
            showFeedback={quiz.instantFeedback && !!answers[currentGroup.question.id]}
            isMarkedForReview={markedForReview.includes(currentGroup.question.id)}
            onToggleMarkForReview={() => toggleMarkForReview(currentGroup.question.id)}
            themeColor={quiz.subject.themeColor}
            isSpeaking={isSpeaking}
            onSpeak={() => speak(currentGroup.question.questionText)}
            onStopSpeaking={stop}
          />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            data-testid="button-previous"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!hasAllAnswers || submitQuizMutation.isPending}
            style={{ backgroundColor: `hsl(${quiz.subject.themeColor})`, color: 'white' }}
            data-testid={isLastGroup ? "button-submit" : "button-next"}
          >
            {submitQuizMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLastGroup ? (
              <>
                Submit Quiz
                <Send className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
