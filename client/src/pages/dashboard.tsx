import { useQuery } from "@tanstack/react-query";
import { SubjectCard } from "@/components/quiz/subject-card";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, ArrowRight, BookOpen, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { PaymentModal } from "@/components/quiz/payment-modal";
import { PhoneAuthModal } from "@/components/auth/phone-auth-modal";
import { Footer } from "@/components/layout/footer";
import { useAuthStore } from "@/store/auth";
import type { Subject, Quiz, Payment, QuizAttempt } from "@shared/schema";
import heroImage from "@assets/Imagine Nigerian law students taking multiple-choice questions in class_1760245749265.jpg";

export default function Dashboard() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuthStore();

  const { data: subjects, isLoading: loadingSubjects } = useQuery<(Subject & { quizzes: Quiz[] })[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments/user"],
    enabled: !!user,
  });

  const { data: quizAttempts } = useQuery<QuizAttempt[]>({
    queryKey: ["/api/quiz-attempts/user"],
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

  // Show hero section if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Hero Content */}
              <div className="order-2 lg:order-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Master Nigerian Law with{" "}
                  <span className="text-primary">Smart MCQ Practice</span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground mb-6">
                  Elevate your legal knowledge with expertly crafted multiple-choice questions. 
                  Track your progress, assess your IQ, and ace your law exams with confidence.
                </p>

                {/* Key Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Expert Content</h3>
                      <p className="text-xs text-muted-foreground">Curated by legal professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">IQ Assessment</h3>
                      <p className="text-xs text-muted-foreground">Track your learning progress</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Instant Feedback</h3>
                      <p className="text-xs text-muted-foreground">Learn from every question</p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={() => setShowAuthModal(true)}
                  className="w-full sm:w-auto"
                  data-testid="button-get-started"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Hero Image */}
              <div className="order-1 lg:order-2">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={heroImage}
                    alt="Nigerian law students practicing MCQ exams"
                    className="w-full h-auto"
                    data-testid="img-hero"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subject Preview Section */}
        {subjects && subjects.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Explore Our Subjects</h2>
              <p className="text-muted-foreground">Choose from a variety of legal topics to start your learning journey</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.slice(0, 6).map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  hasPremiumAccess={false}
                  userQuizAttempts={[]}
                />
              ))}
            </div>

          </section>
        )}

        <PhoneAuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
        <Footer />
      </div>
    );
  }

  // Show dashboard for logged-in users
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back{user?.name ? `, ${user.name}` : ''}!</h1>
            <p className="text-sm text-muted-foreground">Choose a subject to start your quiz journey</p>
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
              userQuizAttempts={quizAttempts || []}
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
      <Footer />
    </div>
  );
}
