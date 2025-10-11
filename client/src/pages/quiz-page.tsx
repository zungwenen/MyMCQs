import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { QuestionCard } from "@/components/quiz/question-card";
import { QuizProgress } from "@/components/quiz/quiz-progress";
import { Button } from "@/components/ui/button";
import { useQuizStore } from "@/store/quiz";
import { useTTS } from "@/hooks/use-tts";
import { Loader2, ChevronRight, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Quiz, Question, Subject } from "@shared/schema";

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

  const { data: quiz, isLoading: loadingQuiz } = useQuery<Quiz & { subject: Subject; questions: Question[] }>({
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

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const hasAnswer = !!answers[currentQuestion.id];

  const handleNext = () => {
    if (isLastQuestion) {
      submitQuizMutation.mutate();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <QuizProgress
        currentQuestion={currentQuestionIndex}
        totalQuestions={quiz.questions.length}
        timeRemaining={timeRemaining}
        timeLimitMinutes={quiz.timeLimitMinutes || undefined}
        themeColor={quiz.subject.themeColor}
      />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.id]}
          onSelectAnswer={(answer) => setAnswer(currentQuestion.id, answer)}
          showFeedback={quiz.instantFeedback && !!answers[currentQuestion.id]}
          isMarkedForReview={markedForReview.includes(currentQuestion.id)}
          onToggleMarkForReview={() => toggleMarkForReview(currentQuestion.id)}
          themeColor={quiz.subject.themeColor}
          isSpeaking={isSpeaking}
          onSpeak={() => speak(currentQuestion.questionText)}
          onStopSpeaking={stop}
        />
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
            disabled={!hasAnswer || submitQuizMutation.isPending}
            style={{ backgroundColor: `hsl(${quiz.subject.themeColor})`, color: 'white' }}
            data-testid={isLastQuestion ? "button-submit" : "button-next"}
          >
            {submitQuizMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLastQuestion ? (
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
    </div>
  );
}
