import { useState, useEffect, type KeyboardEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X, Volume2, VolumeX, Bookmark, CheckCircle } from "lucide-react";
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
  const [localAnswer, setLocalAnswer] = useState("");
  
  // Reset localAnswer when question changes or answer is recorded
  useEffect(() => {
    setLocalAnswer("");
  }, [question.id, selectedAnswer]);
  
  // Check if answer is correct based on question type
  let isCorrect = false;
  let isIncorrect = false;
  
  if (showFeedback && selectedAnswer) {
    if (question.questionType === "fill_in_gap") {
      // For fill-in-gap, check against all acceptable answer variations
      const acceptableAnswers = (question.options as string[]).map(ans => 
        ans.trim().toLowerCase()
      );
      const normalizedUserAnswer = selectedAnswer.trim().toLowerCase();
      isCorrect = acceptableAnswers.includes(normalizedUserAnswer);
      isIncorrect = !isCorrect;
    } else {
      // For MCQ and True/False, use exact matching
      isCorrect = selectedAnswer === question.correctAnswer;
      isIncorrect = selectedAnswer !== question.correctAnswer;
    }
  }

  const handleSubmitFillInGap = () => {
    if (localAnswer.trim() && !selectedAnswer) {
      onSelectAnswer(localAnswer);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmitFillInGap();
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2 justify-end">
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
          <h2 className="text-base md:text-lg font-semibold leading-tight">
            {question.questionText}
          </h2>
        </div>

        {question.questionType === "fill_in_gap" ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type your answer here..."
                  value={selectedAnswer || localAnswer}
                  onChange={(e) => !selectedAnswer && setLocalAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!!selectedAnswer}
                  className={cn(
                    "text-base font-medium flex-1",
                    selectedAnswer && isCorrect && "border-success bg-success/10",
                    selectedAnswer && isIncorrect && "border-destructive bg-destructive/10"
                  )}
                  data-testid="input-answer"
                />
                {!selectedAnswer && localAnswer.trim() && (
                  <Button
                    onClick={handleSubmitFillInGap}
                    size="icon"
                    className="shrink-0"
                    style={{ backgroundColor: `hsl(${themeColor})` }}
                    data-testid="button-submit-answer"
                  >
                    <CheckCircle className="h-5 w-5" />
                  </Button>
                )}
              </div>
              {selectedAnswer && showFeedback && (
                <div className="space-y-2">
                  {isCorrect ? (
                    <Badge variant="outline" className="border-success text-success bg-success/20">
                      <Check className="h-3 w-3 mr-1" />
                      Correct
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline" className="border-destructive text-destructive bg-destructive/20">
                        <X className="h-3 w-3 mr-1" />
                        Incorrect
                      </Badge>
                      <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                        <p className="text-sm font-medium text-success">Correct answer: {question.correctAnswer}</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
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
                    <span className="text-sm md:text-base font-medium flex-1">{option}</span>
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
        )}

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
