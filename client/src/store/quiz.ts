import { create } from 'zustand';

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  markedForReview: string[];
  startTime: number | null;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswer: (questionId: string, answer: string) => void;
  toggleMarkForReview: (questionId: string) => void;
  startQuiz: () => void;
  resetQuiz: () => void;
  getTimeSpent: () => number;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentQuestionIndex: 0,
  answers: {},
  markedForReview: [],
  startTime: null,
  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),
  toggleMarkForReview: (questionId) =>
    set((state) => ({
      markedForReview: state.markedForReview.includes(questionId)
        ? state.markedForReview.filter((id) => id !== questionId)
        : [...state.markedForReview, questionId],
    })),
  startQuiz: () => set({ startTime: Date.now() }),
  resetQuiz: () => set({ currentQuestionIndex: 0, answers: {}, markedForReview: [], startTime: null }),
  getTimeSpent: () => {
    const { startTime } = get();
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  },
}));
