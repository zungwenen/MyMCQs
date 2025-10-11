import { useQuery } from "@tanstack/react-query";
import { SubjectCard } from "@/components/quiz/subject-card";
import { Button } from "@/components/ui/button";
import { Loader2, Crown } from "lucide-react";
import { useState } from "react";
import { PaymentModal } from "@/components/quiz/payment-modal";
import { useAuthStore } from "@/store/auth";
import type { Subject, Quiz, Payment } from "@shared/schema";

export default function Dashboard() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user } = useAuthStore();

  const { data: subjects, isLoading: loadingSubjects } = useQuery<(Subject & { quizzes: Quiz[] })[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments/user"],
    enabled: !!user,
  });

  const hasPremiumAccess = payments?.some((p) => p.status === "success") || false;
  const hasPremiumSubjects = subjects?.some((s) => s.isPremium) || false;

  if (loadingSubjects) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
            <p className="text-muted-foreground">Choose a subject to start your quiz journey</p>
          </div>
          {hasPremiumSubjects && !hasPremiumAccess && (
            <Button
              onClick={() => setShowPaymentModal(true)}
              className="bg-premium hover:bg-premium/90 text-premium-foreground shrink-0"
              data-testid="button-get-premium"
            >
              <Crown className="mr-2 h-4 w-4" />
              Get Premium Access
            </Button>
          )}
        </div>

        {subjects && subjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No subjects available yet. Check back soon!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects?.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              hasPremiumAccess={hasPremiumAccess}
            />
          ))}
        </div>
      </div>

      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSuccess={() => {
          setShowPaymentModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
