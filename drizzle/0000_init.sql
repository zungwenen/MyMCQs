-- Create tables
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone_number" text NOT NULL UNIQUE,
  "name" text,
  "is_verified" boolean DEFAULT false NOT NULL,
  "last_otp_verified_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "admins" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL,
  "is_super_admin" boolean DEFAULT false NOT NULL,
  "created_by_id" varchar,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "otp_sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone_number" text NOT NULL,
  "otp" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subjects" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "description" text,
  "is_premium" boolean DEFAULT false NOT NULL,
  "theme_color" text DEFAULT '217 91% 60%' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "quizzes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject_id" varchar NOT NULL REFERENCES "subjects"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "pass_mark_percentage" integer DEFAULT 50 NOT NULL,
  "time_limit_minutes" integer,
  "instant_feedback" boolean DEFAULT false NOT NULL,
  "randomize_questions" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "questions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "quiz_id" varchar NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "question_text" text NOT NULL,
  "question_type" text NOT NULL,
  "options" jsonb NOT NULL,
  "correct_answer" text NOT NULL,
  "explanation" text,
  "order_index" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "quiz_attempts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "quiz_id" varchar NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "answers" jsonb NOT NULL,
  "marked_for_review" jsonb DEFAULT '[]' NOT NULL,
  "score" integer,
  "total_questions" integer NOT NULL,
  "passed" boolean,
  "time_spent_seconds" integer,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "reference" text NOT NULL UNIQUE,
  "amount" integer NOT NULL,
  "status" text NOT NULL,
  "paystack_response" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payment_settings" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "membership_price" integer DEFAULT 5000 NOT NULL,
  "paystack_split_code" text,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Insert default payment settings
INSERT INTO "payment_settings" ("membership_price", "paystack_split_code") 
VALUES (5000, NULL) 
ON CONFLICT DO NOTHING;
