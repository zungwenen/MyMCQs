import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, CheckCircle2, XCircle, Clock, Award, Home, RotateCcw, Brain } from "lucide-react";
import type { QuizAttempt, Quiz, Subject, Question } from "@shared/schema";

export default function ResultsPage() {
  const { id } = useParams();

  const { data: attempt, isLoading } = useQuery<QuizAttempt & { quiz: Quiz & { subject: Subject; questions: Question[] } }>({
    queryKey: ["/api/quiz-attempts", id],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Results not found</p>
      </div>
    );
  }

  const percentage = Math.round((attempt.score! / attempt.totalQuestions) * 100);
  const passed = attempt.passed;
  const answers = attempt.answers as Record<string, string>;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          {passed ? (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-4">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            {passed ? "Congratulations!" : "Keep Trying!"}
          </h1>
          <p className="text-muted-foreground">
            {passed ? "You passed the quiz" : "You didn't pass this time, but practice makes perfect"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card data-testid="card-score">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-mono">{percentage}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {attempt.score} / {attempt.totalQuestions} correct
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-iq-grade" className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4" />
                IQ Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attempt.iqLabel ? (
                <>
                  <p className="text-3xl font-bold mb-1" data-testid="text-iq-label">{attempt.iqLabel}</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-iq-score">
                    {attempt.iqScore}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl text-muted-foreground mb-1" data-testid="text-not-graded">Not graded</p>
                  <p className="text-xs text-muted-foreground">IQ assessment not configured for this quiz</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-status">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {passed ? (
                <Badge className="bg-success text-success-foreground">
                  <Award className="h-3 w-3 mr-1" />
                  Passed
                </Badge>
              ) : (
                <Badge variant="destructive">
                  Failed
                </Badge>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Pass mark: {attempt.quiz.passMarkPercentage}%
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-time">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {formatTime(attempt.timeSpentSeconds || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full" data-testid="accordion-question-review">
              {attempt.quiz.questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;
                const truncatedQuestion = question.questionText.length > 80 
                  ? question.questionText.substring(0, 80) + "..." 
                  : question.questionText;

                return (
                  <AccordionItem 
                    key={question.id} 
                    value={String(question.id)}
                    className={isCorrect ? "border-success/30" : "border-destructive/30"}
                    data-testid={`review-question-${index}`}
                  >
                    <AccordionTrigger 
                      className={`hover:no-underline ${
                        isCorrect ? "text-success hover:text-success" : "text-destructive hover:text-destructive"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left pr-4">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 shrink-0" />
                        )}
                        <span className="font-medium">
                          Q{index + 1}: <span className="text-foreground">{truncatedQuestion}</span>
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-8 pr-4">
                        <div>
                          <p className="font-medium text-foreground mb-2">{question.questionText}</p>
                        </div>
                        <div className="text-sm space-y-2">
                          <p>
                            <span className="text-muted-foreground">Your answer: </span>
                            <span className={`font-medium ${isCorrect ? "text-success" : "text-destructive"}`}>
                              {userAnswer || "Not answered"}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p>
                              <span className="text-muted-foreground">Correct answer: </span>
                              <span className="font-medium text-success">{question.correctAnswer}</span>
                            </p>
                          )}
                        </div>
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm">
                              <span className="font-medium text-foreground">Explanation: </span>
                              <span className="text-muted-foreground">{question.explanation}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" size="lg" data-testid="button-home">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/quiz/${attempt.quiz.id}`}>
            <Button size="lg" data-testid="button-retry">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
