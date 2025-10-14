import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for quiz takers
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name"),
  isVerified: boolean("is_verified").default(false).notNull(),
  lastOtpVerifiedAt: timestamp("last_otp_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admins table - for super admin and sub-admins
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  createdById: varchar("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// OTP sessions
export const otpSessions = pgTable("otp_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subjects - container for quizzes
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isPremium: boolean("is_premium").default(false).notNull(),
  themeColor: text("theme_color").notNull().default("217 91% 60%"), // HSL format
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quizzes - belongs to a subject
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  passMarkPercentage: integer("pass_mark_percentage").default(50).notNull(),
  timeLimitMinutes: integer("time_limit_minutes"),
  instantFeedback: boolean("instant_feedback").default(false).notNull(),
  randomizeQuestions: boolean("randomize_questions").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Questions - belongs to a quiz
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // 'multiple_choice' | 'true_false' | 'fill_in_gap'
  options: jsonb("options").notNull(), // Array of strings for MCQ, ['True', 'False'] for T/F, acceptable answer variations for fill-in-gap
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(), // {questionId: answer}
  markedForReview: jsonb("marked_for_review").default([]).notNull(), // Array of question IDs
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  passed: boolean("passed"),
  iqScore: integer("iq_score"),
  iqLabel: text("iq_label"),
  timeSpentSeconds: integer("time_spent_seconds"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Payments - for premium access
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reference: text("reference").notNull().unique(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(), // 'pending' | 'success' | 'failed'
  paystackResponse: jsonb("paystack_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment settings - admin configurable
export const paymentSettings = pgTable("payment_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  membershipPrice: integer("membership_price").notNull().default(5000), // in kobo
  paystackSplitCode: text("paystack_split_code"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// IQ Grades - configurable IQ assessment ranges
export const iqGrades = pgTable("iq_grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id").references(() => subjects.id, { onDelete: "cascade" }), // null means global
  minScorePercentage: integer("min_score_percentage").notNull(),
  maxScorePercentage: integer("max_score_percentage").notNull(),
  minIQ: integer("min_iq").notNull(),
  maxIQ: integer("max_iq").notNull(),
  label: text("label").notNull(), // e.g., "Genius", "Above Average", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAdminSchema = createInsertSchema(admins).omit({ id: true, createdAt: true });
export const insertOtpSessionSchema = createInsertSchema(otpSessions).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, startedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({ id: true, updatedAt: true });
export const insertIqGradeSchema = createInsertSchema(iqGrades).omit({ id: true, createdAt: true });

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type OtpSession = typeof otpSessions.$inferSelect;
export type InsertOtpSession = z.infer<typeof insertOtpSessionSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;

export type IqGrade = typeof iqGrades.$inferSelect;
export type InsertIqGrade = z.infer<typeof insertIqGradeSchema>;

// Relations
export const subjectsRelations = relations(subjects, ({ many }) => ({
  quizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [quizzes.subjectId],
    references: [subjects.id],
  }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const iqGradesRelations = relations(iqGrades, ({ one }) => ({
  subject: one(subjects, {
    fields: [iqGrades.subjectId],
    references: [subjects.id],
  }),
}));
