import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Volume2, VolumeX, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@shared/schema";

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
  showFeedback?: boolean;
  isMarkedForReview: boolean;
  onToggleMarkForReview: () => void;
  themeColor: string;
  isSpeaking: boolean;
  onSpeak: () => void;
  onStopSpeaking: () => void;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  showFeedback,
  isMarkedForReview,
  onToggleMarkForReview,
  themeColor,
  isSpeaking,
  onSpeak,
  onStopSpeaking,
}: QuestionCardProps) {
  const options = question.options as string[];
  const isCorrect = showFeedback && selectedAnswer === question.correctAnswer;
  const isIncorrect = showFeedback && selectedAnswer && selectedAnswer !== question.correctAnswer;

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-semibold leading-tight flex-1">
            {question.questionText}
          </h2>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={isMarkedForReview ? onToggleMarkForReview : onToggleMarkForReview}
              className={cn(
                "shrink-0",
                isMarkedForReview && "text-warning"
              )}
              data-testid="button-mark-review"
            >
              <Bookmark className={cn("h-5 w-5", isMarkedForReview && "fill-current")} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={isSpeaking ? onStopSpeaking : onSpeak}
              className="shrink-0"
              data-testid="button-tts"
            >
              {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isThisCorrect = showFeedback && option === question.correctAnswer;
            const isThisWrong = showFeedback && isSelected && option !== question.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => !showFeedback && onSelectAnswer(option)}
                disabled={showFeedback}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  "hover-elevate active-elevate-2",
                  !showFeedback && !isSelected && "border-border bg-card",
                  !showFeedback && isSelected && "border-primary bg-primary/5",
                  isThisCorrect && "border-success bg-success/10",
                  isThisWrong && "border-destructive bg-destructive/10"
                )}
                style={
                  !showFeedback && isSelected
                    ? { borderColor: `hsl(${themeColor})`, backgroundColor: `hsl(${themeColor} / 0.05)` }
                    : {}
                }
                data-testid={`option-${index}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium flex-1">{option}</span>
                  {isThisCorrect && (
                    <Badge variant="outline" className="border-success text-success bg-success/20">
                      <Check className="h-3 w-3 mr-1" />
                      Correct
                    </Badge>
                  )}
                  {isThisWrong && (
                    <Badge variant="outline" className="border-destructive text-destructive bg-destructive/20">
                      <X className="h-3 w-3 mr-1" />
                      Wrong
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showFeedback && question.explanation && (
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border animate-slide-up">
            <p className="text-sm font-medium mb-2">Explanation</p>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
