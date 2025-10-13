import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Subject, Quiz, QuizAttempt } from "@shared/schema";
import { Link } from "wouter";

interface SubjectCardProps {
  subject: Subject & { quizzes: Quiz[] };
  hasPremiumAccess: boolean;
  userQuizAttempts: QuizAttempt[];
}

export function SubjectCard({ subject, hasPremiumAccess, userQuizAttempts }: SubjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const canAccess = !subject.isPremium || hasPremiumAccess;

  const hasAttempted = (quizId: string) => {
    return userQuizAttempts.some(attempt => attempt.quizId === quizId && attempt.completedAt);
  };

  return (
    <Card 
      className="overflow-hidden transition-all hover-elevate"
      style={{ borderLeftColor: `hsl(${subject.themeColor})`, borderLeftWidth: '4px' }}
      data-testid={`card-subject-${subject.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1 flex items-center gap-2">
              {subject.name}
              {subject.isPremium && (
                <Crown className="h-4 w-4 text-premium" />
              )}
            </CardTitle>
            <CardDescription>{subject.description}</CardDescription>
          </div>
          {subject.isPremium && (
            <Badge 
              variant="outline" 
              className="border-premium text-premium bg-premium/10"
              data-testid="badge-premium"
            >
              Premium
            </Badge>
          )}
          {!subject.isPremium && (
            <Badge 
              variant="outline" 
              className="border-success text-success bg-success/10"
              data-testid="badge-free"
            >
              Free
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setExpanded(!expanded)}
          data-testid={`button-toggle-quizzes-${subject.id}`}
        >
          <span className="text-sm font-medium">
            {subject.quizzes.length} {subject.quizzes.length === 1 ? 'Quiz' : 'Quizzes'}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expanded && (
          <div className="space-y-2 pt-2 border-t animate-slide-up">
            {subject.quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                data-testid={`quiz-item-${quiz.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{quiz.title}</p>
                  {quiz.description && (
                    <p className="text-xs text-muted-foreground mt-1">{quiz.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {quiz.timeLimitMinutes && (
                      <span>{quiz.timeLimitMinutes} mins</span>
                    )}
                    <span>Pass: {quiz.passMarkPercentage}%</span>
                  </div>
                </div>
                {canAccess ? (
                  <Link href={`/quiz/${quiz.id}`}>
                    <Button
                      size="sm"
                      style={{ backgroundColor: `hsl(${subject.themeColor})`, color: 'white' }}
                      className="ml-3"
                      data-testid={`button-start-quiz-${quiz.id}`}
                    >
                      {hasAttempted(quiz.id) ? 'Retake' : 'Start'}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-3 border-premium text-premium"
                    disabled
                    data-testid={`button-locked-quiz-${quiz.id}`}
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    Locked
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
