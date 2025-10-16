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
import { Loader2, ChevronRight, Send, FileText, Volume2, VolumeX } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Quiz, Question, Subject, Scenario } from "@shared/schema";
import { Footer } from "@/components/layout/footer";

type QuizWithScenarios = Quiz & { 
  subject: Subject; 
  questions: Question[];
  scenarios?: (Scenario & { questions?: Question[] })[];
};

type QuestionGroup = 
  | { type: 'scenario'; scenario: Scenario; questions: Question[] }
  | { type: 'single'; question: Question };

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

  const handleSubmitQuiz = () => {
    const timeSpentSeconds = getTimeSpent();
    submitMutation.mutate({
      answers,
      markedForReview,
      timeSpentSeconds,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) {
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

  if (!currentGroup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No questions available</p>
      </div>
    );
  }

  const themeColor = quiz.subject.themeColor;

  // Check if all questions in current group are answered
  const isGroupAnswered = currentGroup.type === 'scenario'
    ? currentGroup.questions.every(q => !!answers[q.id])
    : !!answers[currentGroup.question.id];

  const handleNext = () => {
    if (!isLastGroup) {
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

  const handleSpeak = (text: string) => {
    speak(text);
  };

  return (
    <div className="min-h-screen pb-20">
      <QuizProgress
        currentQuestion={currentQuestionIndex}
        totalQuestions={questionGroups.length}
        timeRemaining={timeRemaining}
        timeLimitMinutes={quiz.timeLimitMinutes || undefined}
        themeColor={themeColor}
      />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-8">
        <div className="space-y-6">
          {currentGroup.type === 'scenario' ? (
            <Accordion type="single" defaultValue="scenario" collapsible className="w-full">
              <AccordionItem value="scenario" className="border-2" style={{ borderColor: `hsl(${themeColor} / 0.3)` }}>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0" style={{ color: `hsl(${themeColor})` }} />
                    <span className="font-semibold text-base md:text-lg">Read this scenario and answer the questions that follow.</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-muted-foreground flex-1">
                      {currentGroup.scenario.passage}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSpeak(currentGroup.scenario.passage)}
                      className="shrink-0"
                      data-testid="button-speak-passage"
                    >
                      {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}

          {currentGroup.type === 'scenario' ? (
            <div className="space-y-4">
              {currentGroup.questions.map((question, index) => {
                const selectedAnswer = answers[question.id];
                const isMarked = markedForReview.includes(question.id);
                
                return (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    selectedAnswer={selectedAnswer}
                    onSelectAnswer={(answer) => setAnswer(question.id, answer)}
                    showFeedback={quiz.instantFeedback && !!selectedAnswer}
                    isMarkedForReview={isMarked}
                    onToggleMarkForReview={() => toggleMarkForReview(question.id)}
                    themeColor={themeColor}
                    isSpeaking={false}
                    onSpeak={() => handleSpeak(question.questionText)}
                    onStopSpeaking={stop}
                    questionNumber={index + 1}
                  />
                );
              })}
            </div>
          ) : (
            <QuestionCard
              question={currentGroup.question}
              selectedAnswer={answers[currentGroup.question.id]}
              onSelectAnswer={(answer) => setAnswer(currentGroup.question.id, answer)}
              showFeedback={quiz.instantFeedback && !!answers[currentGroup.question.id]}
              isMarkedForReview={markedForReview.includes(currentGroup.question.id)}
              onToggleMarkForReview={() => toggleMarkForReview(currentGroup.question.id)}
              themeColor={themeColor}
              isSpeaking={isSpeaking}
              onSpeak={() => handleSpeak(currentGroup.question.questionText)}
              onStopSpeaking={stop}
              questionNumber={currentQuestionIndex + 1}
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex-1"
              data-testid="button-previous"
            >
              Previous
            </Button>
            {!isLastGroup ? (
              <Button
                onClick={handleNext}
                disabled={!isGroupAnswered}
                className="flex-1"
                style={{ backgroundColor: `hsl(${themeColor})` }}
                data-testid="button-next"
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
      </div>

      <Footer />
    </div>
  );
}
