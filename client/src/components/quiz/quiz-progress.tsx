import { Progress } from "@/components/ui/progress";
import { Timer } from "lucide-react";

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining?: number;
  timeLimitMinutes?: number;
  themeColor: string;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  timeRemaining,
  timeLimitMinutes,
  themeColor,
}: QuizProgressProps) {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = timeRemaining !== undefined && timeRemaining < 60;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-background border-b"
      style={{
        borderBottomColor: `hsl(${themeColor} / 0.2)`
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          {timeRemaining !== undefined && (
            <div 
              className={`flex items-center gap-2 font-mono text-sm px-2 py-1 rounded ${isLowTime ? "text-warning bg-warning/10" : ""}`}
              style={!isLowTime ? {
                color: `hsl(${themeColor})`,
                backgroundColor: `hsl(${themeColor} / 0.1)`
              } : undefined}
            >
              <Timer className="h-4 w-4" />
              <span data-testid="timer">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        <Progress 
          value={progress} 
          className="h-2"
          style={{
            // @ts-ignore
            '--progress-background': `hsl(${themeColor})`
          }}
          data-testid="progress-bar"
        />
      </div>
    </div>
  );
}
