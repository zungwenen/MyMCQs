import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import { sendOTP, generateOTP } from "./services/twilio";
import bcrypt from "bcrypt";
import { attachUser, requireUser, requireAdmin, createSessionToken, invalidateSession } from "./middleware/session";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.use(attachUser);
  
  // ===== SEED SUPER ADMIN (one-time) =====
  app.post("/api/seed-admin", async (req, res) => {
    try {
      const existingAdmin = await db.query.admins.findFirst({
        where: eq(schema.admins.username, "admin"),
      });

      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const [admin] = await db.insert(schema.admins).values({
          username: "admin",
          password: hashedPassword,
          isSuperAdmin: true,
        }).returning();
        res.json({ message: "Super admin created", admin });
      } else {
        res.json({ message: "Super admin already exists", admin: existingAdmin });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ===== AUTH ROUTES =====
  
  // Send OTP
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phoneNumber),
      });

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const [session] = await db.insert(schema.otpSessions).values({
        phoneNumber,
        otp,
        expiresAt,
      }).returning();

      await sendOTP(phoneNumber, otp);

      res.json({
        sessionId: session.id,
        requiresName: !existingUser || !existingUser.name,
        message: "OTP sent successfully",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verify OTP
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { sessionId, otp, name } = req.body;

      const session = await db.query.otpSessions.findFirst({
        where: and(
          eq(schema.otpSessions.id, sessionId),
          eq(schema.otpSessions.otp, otp)
        ),
      });

      if (!session || session.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await db.update(schema.otpSessions)
        .set({ verified: true })
        .where(eq(schema.otpSessions.id, sessionId));

      let user = await db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, session.phoneNumber),
      });

      if (!user) {
        const [newUser] = await db.insert(schema.users).values({
          phoneNumber: session.phoneNumber,
          name: name || null,
          isVerified: true,
          lastOtpVerifiedAt: new Date(),
        }).returning();
        user = newUser;
      } else {
        const updateData: any = {
          isVerified: true,
          lastOtpVerifiedAt: new Date(),
        };
        if (name && !user.name) {
          updateData.name = name;
        }
        const [updatedUser] = await db.update(schema.users)
          .set(updateData)
          .where(eq(schema.users.id, user.id))
          .returning();
        user = updatedUser;
      }

      // Set httpOnly cookie for session with signed token
      const userToken = createSessionToken(user.id, 'user');
      res.cookie('userToken', userToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 28 * 24 * 60 * 60 * 1000, // 28 days
      });

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Login without OTP (if verified within 4 weeks)
  app.post("/api/auth/login-without-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      const user = await db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phoneNumber),
      });

      if (!user || !user.isVerified || !user.lastOtpVerifiedAt) {
        return res.status(401).json({ message: "OTP required" });
      }

      const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
      if (user.lastOtpVerifiedAt < fourWeeksAgo) {
        return res.status(401).json({ message: "OTP required" });
      }

      // Set httpOnly cookie for session with signed token
      const userToken = createSessionToken(user.id, 'user');
      res.cookie('userToken', userToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 28 * 24 * 60 * 60 * 1000, // 28 days
      });

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user profile
  app.patch("/api/users/profile", requireUser, async (req, res) => {
    try {
      const { name } = req.body;
      const userId = (req as any).userId;

      const [user] = await db.update(schema.users)
        .set({ name })
        .where(eq(schema.users.id, userId))
        .returning();

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== ADMIN AUTH ROUTES =====
  
  // Check if setup is needed (no admins exist)
  app.get("/api/admin/setup-needed", async (req, res) => {
    try {
      const adminCount = await db.select({ count: sql<number>`count(*)::int` })
        .from(schema.admins);
      
      const needsSetup = adminCount[0].count === 0;
      res.json({ needsSetup });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Initial setup - create first super admin (only works if no admins exist)
  app.post("/api/admin/setup", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Check if any admins already exist
      const adminCount = await db.select({ count: sql<number>`count(*)::int` })
        .from(schema.admins);
      
      if (adminCount[0].count > 0) {
        return res.status(403).json({ message: "Setup already completed. Admins exist in the system." });
      }

      // Validate inputs
      if (!username || username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Create the first super admin
      const hashedPassword = await bcrypt.hash(password, 10);
      const [admin] = await db.insert(schema.admins).values({
        username,
        password: hashedPassword,
        isSuperAdmin: true,
      }).returning();

      res.json({ 
        success: true, 
        message: "Super admin created successfully",
        admin: { id: admin.id, username: admin.username }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const admin = await db.query.admins.findFirst({
        where: eq(schema.admins.username, username),
      });

      if (!admin || !(await bcrypt.compare(password, admin.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set httpOnly cookie for admin session with signed token
      const adminToken = createSessionToken(admin.id, 'admin');
      res.cookie('adminToken', adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({ admin });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get current session
  app.get("/api/auth/me", async (req, res) => {
    const user = (req as any).user;
    const admin = (req as any).admin;
    res.json({ user: user || null, admin: admin || null });
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    // Invalidate sessions server-side
    const userToken = req.cookies?.userToken;
    const adminToken = req.cookies?.adminToken;
    
    if (userToken) {
      invalidateSession(userToken);
    }
    if (adminToken) {
      invalidateSession(adminToken);
    }
    
    res.clearCookie('userToken');
    res.clearCookie('adminToken');
    res.json({ success: true });
  });

  app.post("/api/admin/create-admin", requireAdmin, async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const [admin] = await db.insert(schema.admins).values({
        username,
        password: hashedPassword,
        isSuperAdmin: false,
      }).returning();

      res.json({ admin });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/admins", requireAdmin, async (req, res) => {
    try {
      const admins = await db.query.admins.findMany();
      res.json(admins);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/admins/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(schema.admins).where(eq(schema.admins.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== SUBJECT ROUTES =====
  
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await db.query.subjects.findMany({
        with: {
          quizzes: true,
        },
      });
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/subjects", async (req, res) => {
    try {
      const subjects = await db.query.subjects.findMany();
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/subjects", requireAdmin, async (req, res) => {
    try {
      const { name, description, isPremium, themeColor } = req.body;
      const [subject] = await db.insert(schema.subjects).values({
        name,
        description,
        isPremium,
        themeColor,
      }).returning();
      res.json(subject);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/subjects/:id", requireAdmin, async (req, res) => {
    try {
      const { name, description, isPremium, themeColor } = req.body;
      const [subject] = await db.update(schema.subjects)
        .set({ name, description, isPremium, themeColor })
        .where(eq(schema.subjects.id, req.params.id))
        .returning();
      res.json(subject);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/subjects/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(schema.subjects).where(eq(schema.subjects.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== QUIZ ROUTES =====
  
  app.get("/api/quizzes/:id", requireUser, async (req, res) => {
    try {
      const quiz = await db.query.quizzes.findFirst({
        where: eq(schema.quizzes.id, req.params.id),
        with: {
          subject: true,
          questions: {
            orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
          },
        },
      });
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/quizzes", requireAdmin, async (req, res) => {
    try {
      const quizzes = await db.query.quizzes.findMany({
        with: {
          subject: true,
        },
      });
      res.json(quizzes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/quizzes/:id", async (req, res) => {
    try {
      const quiz = await db.query.quizzes.findFirst({
        where: eq(schema.quizzes.id, req.params.id),
      });
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/quizzes", requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      const [quiz] = await db.insert(schema.quizzes).values(data).returning();
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/quizzes/:id", requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      const [quiz] = await db.update(schema.quizzes)
        .set(data)
        .where(eq(schema.quizzes.id, req.params.id))
        .returning();
      res.json(quiz);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/quizzes/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(schema.quizzes).where(eq(schema.quizzes.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== QUESTION ROUTES =====
  
  app.get("/api/admin/questions/:quizId", requireAdmin, async (req, res) => {
    try {
      const questions = await db.query.questions.findMany({
        where: eq(schema.questions.quizId, req.params.quizId),
        orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
      });
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/quizzes/:quizId/questions", requireAdmin, async (req, res) => {
    try {
      const { questionText, questionType, options, correctAnswer, explanation } = req.body;
      
      const existingQuestions = await db.query.questions.findMany({
        where: eq(schema.questions.quizId, req.params.quizId),
      });
      
      const orderIndex = existingQuestions.length;

      const [question] = await db.insert(schema.questions).values({
        quizId: req.params.quizId,
        questionText,
        questionType,
        options,
        correctAnswer,
        explanation,
        orderIndex,
      }).returning();

      res.json(question);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/questions/:id", requireAdmin, async (req, res) => {
    try {
      const { questionText, questionType, options, correctAnswer, explanation } = req.body;
      const [question] = await db.update(schema.questions)
        .set({ questionText, questionType, options, correctAnswer, explanation })
        .where(eq(schema.questions.id, req.params.id))
        .returning();
      res.json(question);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/questions/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(schema.questions).where(eq(schema.questions.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== QUIZ ATTEMPT ROUTES =====
  
  app.post("/api/quizzes/:id/submit", requireUser, async (req, res) => {
    try {
      const { answers, markedForReview, timeSpentSeconds } = req.body;
      const quizId = req.params.id;
      const userId = (req as any).userId;

      const quiz = await db.query.quizzes.findFirst({
        where: eq(schema.quizzes.id, quizId),
        with: {
          questions: true,
          subject: true,
        },
      });

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      let score = 0;
      quiz.questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) {
          score++;
        }
      });

      const percentage = (score / quiz.questions.length) * 100;
      const passed = percentage >= quiz.passMarkPercentage;

      // Calculate IQ score
      let iqScore = null;
      let iqLabel = null;

      // First try to get subject-specific IQ grades
      let iqGrades = await db.query.iqGrades.findMany({
        where: eq(schema.iqGrades.subjectId, quiz.subjectId),
        orderBy: (grades, { asc }) => [asc(grades.minScorePercentage)],
      });

      // If no subject-specific grades, get global grades
      if (iqGrades.length === 0) {
        iqGrades = await db.query.iqGrades.findMany({
          where: sql`${schema.iqGrades.subjectId} IS NULL`,
          orderBy: (grades, { asc }) => [asc(grades.minScorePercentage)],
        });
      }

      // Find matching IQ grade and calculate IQ score
      if (iqGrades.length > 0) {
        const matchingGrade = iqGrades.find(grade => 
          percentage >= grade.minScorePercentage && percentage <= grade.maxScorePercentage
        );

        if (matchingGrade) {
          // Calculate IQ within the range based on percentage within the score range
          const scoreRange = matchingGrade.maxScorePercentage - matchingGrade.minScorePercentage;
          const iqRange = matchingGrade.maxIQ - matchingGrade.minIQ;
          const scorePositionInRange = percentage - matchingGrade.minScorePercentage;
          const iqPositionInRange = (scorePositionInRange / scoreRange) * iqRange;
          
          iqScore = Math.round(matchingGrade.minIQ + iqPositionInRange);
          iqLabel = matchingGrade.label;
        }
      }

      const [attempt] = await db.insert(schema.quizAttempts).values({
        userId,
        quizId,
        answers,
        markedForReview,
        score,
        totalQuestions: quiz.questions.length,
        passed,
        iqScore,
        iqLabel,
        timeSpentSeconds,
        completedAt: new Date(),
      }).returning();

      res.json({ attemptId: attempt.id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quiz-attempts/:id", requireUser, async (req, res) => {
    try {
      const attempt = await db.query.quizAttempts.findFirst({
        where: eq(schema.quizAttempts.id, req.params.id),
        with: {
          quiz: {
            with: {
              subject: true,
              questions: {
                orderBy: (questions, { asc }) => [asc(questions.orderIndex)],
              },
            },
          },
        },
      });
      res.json(attempt);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quiz-attempts", requireUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const attempts = await db.query.quizAttempts.findMany({
        where: eq(schema.quizAttempts.userId, userId),
        with: {
          quiz: {
            with: {
              subject: true,
            },
          },
        },
        orderBy: (attempts, { desc }) => [desc(attempts.completedAt)],
      });
      res.json(attempts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/attempts", requireAdmin, async (req, res) => {
    try {
      const attempts = await db.query.quizAttempts.findMany({
        orderBy: (attempts, { desc }) => [desc(attempts.completedAt)],
      });
      res.json(attempts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== PAYMENT ROUTES =====
  
  app.post("/api/payments/initialize", requireUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      const settings = await db.query.paymentSettings.findFirst();

      const reference = `PAY_${Date.now()}_${userId}`;
      
      // Build callback URL from APP_URL environment variable
      // APP_URL should be set to your domain (e.g., https://iq.easyread.ng)
      const appUrl = process.env.APP_URL;
      
      let baseUrl: string;
      if (appUrl) {
        // Production/Custom domain: Use APP_URL
        baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
      } else {
        // Fallback for local development
        baseUrl = 'http://localhost:5000';
      }
      
      const url = new URL(baseUrl);
      url.pathname = '/payment-callback';
      const callbackUrl = url.toString();
      
      // Initialize Paystack payment
      const paystackUrl = "https://api.paystack.co/transaction/initialize";
      const paystackData: any = {
        email: `${user?.phoneNumber}@easyreadiq.com`,
        amount: settings?.membershipPrice || 5000,
        reference,
        callback_url: callbackUrl,
      };

      if (settings?.paystackSplitCode) {
        paystackData.split_code = settings.paystackSplitCode;
      }

      const response = await fetch(paystackUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackData),
      });

      const data = await response.json();

      if (data.status) {
        await db.insert(schema.payments).values({
          userId,
          reference,
          amount: settings?.membershipPrice || 5000,
          status: "pending",
          paystackResponse: data.data,
        });

        res.json(data.data);
      } else {
        res.status(400).json({ message: data.message || "Payment initialization failed" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payments/verify/:reference", async (req, res) => {
    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${req.params.reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (data.status && data.data.status === "success") {
        await db.update(schema.payments)
          .set({ status: "success", paystackResponse: data.data })
          .where(eq(schema.payments.reference, req.params.reference));
      }

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payments/user", requireUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const payments = await db.query.payments.findMany({
        where: eq(schema.payments.userId, userId),
        orderBy: (payments, { desc }) => [desc(payments.createdAt)],
      });
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/payments", requireAdmin, async (req, res) => {
    try {
      const payments = await db.query.payments.findMany({
        orderBy: (payments, { desc }) => [desc(payments.createdAt)],
      });
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== PAYMENT SETTINGS ROUTES =====
  
  app.get("/api/payment-settings", async (req, res) => {
    try {
      const settings = await db.query.paymentSettings.findFirst();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/payment-settings", requireAdmin, async (req, res) => {
    try {
      const { membershipPrice, paystackSplitCode } = req.body;
      const settings = await db.query.paymentSettings.findFirst();
      
      let result;
      if (settings) {
        // Update existing settings
        const [updated] = await db.update(schema.paymentSettings)
          .set({ membershipPrice, paystackSplitCode, updatedAt: new Date() })
          .where(eq(schema.paymentSettings.id, settings.id))
          .returning();
        result = updated;
      } else {
        // Create new settings (for fresh production databases)
        const [created] = await db.insert(schema.paymentSettings)
          .values({ membershipPrice, paystackSplitCode })
          .returning();
        result = created;
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== IQ GRADES ROUTES =====
  
  app.get("/api/admin/iq-grades", requireAdmin, async (req, res) => {
    try {
      const grades = await db.query.iqGrades.findMany({
        with: {
          subject: true,
        },
        orderBy: (grades, { asc }) => [asc(grades.minScorePercentage)],
      });
      res.json(grades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/iq-grades", requireAdmin, async (req, res) => {
    try {
      const validated = schema.insertIqGradeSchema.parse(req.body);
      const [grade] = await db.insert(schema.iqGrades).values(validated).returning();
      res.json(grade);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/iq-grades/:id", requireAdmin, async (req, res) => {
    try {
      const validated = schema.insertIqGradeSchema.partial().parse(req.body);
      const [updated] = await db.update(schema.iqGrades)
        .set(validated)
        .where(eq(schema.iqGrades.id, req.params.id))
        .returning();
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/iq-grades/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(schema.iqGrades).where(eq(schema.iqGrades.id, req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/iq-grades/:subjectId?", async (req, res) => {
    try {
      const { subjectId } = req.params;
      let grades;
      
      if (subjectId) {
        // Get subject-specific grades first, then fall back to global
        grades = await db.query.iqGrades.findMany({
          where: eq(schema.iqGrades.subjectId, subjectId),
          orderBy: (grades, { asc }) => [asc(grades.minScorePercentage)],
        });
        
        // If no subject-specific grades, get global ones
        if (grades.length === 0) {
          grades = await db.query.iqGrades.findMany({
            where: sql`${schema.iqGrades.subjectId} IS NULL`,
            orderBy: (grades, { asc }) => [asc(grades.minScorePercentage)],
          });
        }
      } else {
        // Get only global grades
        grades = await db.query.iqGrades.findMany({
          where: sql`${schema.iqGrades.subjectId} IS NULL`,
          orderBy: (grades, { asc }) => [asc(grades.minScorePercentage)],
        });
      }
      
      res.json(grades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
