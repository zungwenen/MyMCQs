import { db } from "./db";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedProduction() {
  try {
    console.log("🌱 Starting production database seeding...");

    // 1. Seed Super Admin
    console.log("\n📌 Seeding super admin...");
    const existingAdmin = await db.query.admins.findFirst({
      where: eq(schema.admins.username, "admin"),
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(schema.admins).values({
        username: "admin",
        password: hashedPassword,
        isSuperAdmin: true,
      });
      console.log("✅ Super admin created: username='admin', password='admin123'");
    } else {
      console.log("✅ Super admin already exists");
    }

    // 2. Seed Payment Settings
    console.log("\n📌 Seeding payment settings...");
    const existingSettings = await db.query.paymentSettings.findFirst();
    
    if (!existingSettings) {
      await db.insert(schema.paymentSettings).values({
        membershipPrice: 5000, // ₦50 in kobo
        paystackSplitCode: null,
      });
      console.log("✅ Payment settings created: ₦50 membership price");
    } else {
      console.log("✅ Payment settings already exist");
    }

    // 3. Seed Subjects
    console.log("\n📌 Seeding subjects...");
    const subjects = [
      {
        name: "Mathematics",
        description: "Test your mathematical skills with challenging problems",
        isPremium: false,
        themeColor: "217 91% 60%", // Blue
      },
      {
        name: "Science",
        description: "Explore scientific concepts and theories",
        isPremium: true,
        themeColor: "142 71% 45%", // Green
      },
      {
        name: "History",
        description: "Learn about important historical events",
        isPremium: false,
        themeColor: "24 95% 53%", // Orange
      },
    ];

    const subjectIds: Record<string, string> = {};

    for (const subject of subjects) {
      const existing = await db.query.subjects.findFirst({
        where: eq(schema.subjects.name, subject.name),
      });

      if (!existing) {
        const [inserted] = await db.insert(schema.subjects).values(subject).returning();
        subjectIds[subject.name] = inserted.id;
        console.log(`✅ Created subject: ${subject.name} (${subject.isPremium ? 'Premium' : 'Free'})`);
      } else {
        subjectIds[subject.name] = existing.id;
        console.log(`✅ Subject already exists: ${subject.name}`);
      }
    }

    // 4. Seed Quizzes
    console.log("\n📌 Seeding quizzes...");
    const quizzes = [
      {
        subjectName: "Mathematics",
        title: "Basic Algebra",
        description: "Test your knowledge of basic algebraic concepts",
        passMarkPercentage: 70,
        timeLimitMinutes: 30,
        instantFeedback: false,
        randomizeQuestions: false,
      },
      {
        subjectName: "Mathematics",
        title: "Geometry Fundamentals",
        description: "Explore shapes, angles, and geometric principles",
        passMarkPercentage: 60,
        timeLimitMinutes: 25,
        instantFeedback: false,
        randomizeQuestions: false,
      },
      {
        subjectName: "Science",
        title: "Physics Basics",
        description: "Understanding fundamental physics concepts",
        passMarkPercentage: 65,
        timeLimitMinutes: 40,
        instantFeedback: false,
        randomizeQuestions: false,
      },
      {
        subjectName: "History",
        title: "World War II",
        description: "Key events and figures of WWII",
        passMarkPercentage: 70,
        timeLimitMinutes: 35,
        instantFeedback: false,
        randomizeQuestions: false,
      },
    ];

    const quizIds: Record<string, string> = {};

    for (const quiz of quizzes) {
      const existing = await db.query.quizzes.findFirst({
        where: eq(schema.quizzes.title, quiz.title),
      });

      if (!existing) {
        const [inserted] = await db.insert(schema.quizzes).values({
          subjectId: subjectIds[quiz.subjectName],
          title: quiz.title,
          description: quiz.description,
          passMarkPercentage: quiz.passMarkPercentage,
          timeLimitMinutes: quiz.timeLimitMinutes,
          instantFeedback: quiz.instantFeedback,
          randomizeQuestions: quiz.randomizeQuestions,
        }).returning();
        quizIds[quiz.title] = inserted.id;
        console.log(`✅ Created quiz: ${quiz.title} (${quiz.subjectName})`);
      } else {
        quizIds[quiz.title] = existing.id;
        console.log(`✅ Quiz already exists: ${quiz.title}`);
      }
    }

    // 5. Seed Questions
    console.log("\n📌 Seeding questions...");
    const questions = [
      // Basic Algebra Questions
      {
        quizTitle: "Basic Algebra",
        questionText: "What is 2 + 2?",
        questionType: "multiple_choice",
        options: ["2", "3", "4", "5"],
        correctAnswer: "4",
        explanation: "2 + 2 equals 4",
        orderIndex: 0,
      },
      {
        quizTitle: "Basic Algebra",
        questionText: "Solve for x: 2x + 4 = 10",
        questionType: "multiple_choice",
        options: ["x = 2", "x = 3", "x = 4", "x = 5"],
        correctAnswer: "x = 3",
        explanation: "2x = 6, therefore x = 3",
        orderIndex: 1,
      },
      {
        quizTitle: "Basic Algebra",
        questionText: "Is 5 a prime number?",
        questionType: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "5 is only divisible by 1 and itself",
        orderIndex: 2,
      },
      // Geometry Questions
      {
        quizTitle: "Geometry Fundamentals",
        questionText: "How many degrees are in a triangle?",
        questionType: "multiple_choice",
        options: ["90", "180", "270", "360"],
        correctAnswer: "180",
        explanation: "The sum of angles in a triangle is always 180 degrees",
        orderIndex: 0,
      },
      {
        quizTitle: "Geometry Fundamentals",
        questionText: "A square has 4 equal sides",
        questionType: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "By definition, a square has four equal sides",
        orderIndex: 1,
      },
      // Physics Questions
      {
        quizTitle: "Physics Basics",
        questionText: "What is the speed of light in vacuum?",
        questionType: "multiple_choice",
        options: ["299,792,458 m/s", "300,000 m/s", "150,000 km/s", "299,792 km/s"],
        correctAnswer: "299,792,458 m/s",
        explanation: "The speed of light in vacuum is exactly 299,792,458 meters per second",
        orderIndex: 0,
      },
      {
        quizTitle: "Physics Basics",
        questionText: "Energy cannot be created or destroyed",
        questionType: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "This is the law of conservation of energy",
        orderIndex: 1,
      },
      // History Questions
      {
        quizTitle: "World War II",
        questionText: "When did World War II end?",
        questionType: "multiple_choice",
        options: ["1943", "1944", "1945", "1946"],
        correctAnswer: "1945",
        explanation: "World War II ended in 1945",
        orderIndex: 0,
      },
      {
        quizTitle: "World War II",
        questionText: "The atomic bomb was used in WWII",
        questionType: "true_false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "Atomic bombs were dropped on Hiroshima and Nagasaki in 1945",
        orderIndex: 1,
      },
    ];

    for (const question of questions) {
      const existing = await db.query.questions.findFirst({
        where: eq(schema.questions.questionText, question.questionText),
      });

      if (!existing) {
        await db.insert(schema.questions).values({
          quizId: quizIds[question.quizTitle],
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          orderIndex: question.orderIndex,
        });
        console.log(`✅ Created question: ${question.questionText.substring(0, 50)}...`);
      } else {
        console.log(`✅ Question already exists: ${question.questionText.substring(0, 50)}...`);
      }
    }

    console.log("\n✨ Production database seeding completed successfully!");
    console.log("\n📝 Summary:");
    console.log("   - Super Admin: username='admin', password='admin123'");
    console.log("   - 3 Subjects (Mathematics, Science, History)");
    console.log("   - 4 Quizzes with demo questions");
    console.log("   - Payment settings: ₦50 membership");
    console.log("\n🚀 Your production app is ready!");

  } catch (error) {
    console.error("❌ Error seeding production database:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedProduction();
