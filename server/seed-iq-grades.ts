import { db } from "./db";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

async function seedIQGrades() {
  try {
    console.log("🧠 Seeding default IQ grade ranges...");

    // Check if any IQ grades already exist
    const existingGrades = await db.query.iqGrades.findFirst();
    
    if (existingGrades) {
      console.log("✅ IQ grades already exist. Skipping seed.");
      process.exit(0);
    }

    // Default global IQ grade ranges based on standard IQ distribution
    const defaultGrades = [
      {
        subjectId: null, // Global
        minScorePercentage: 0,
        maxScorePercentage: 39,
        minIQ: 70,
        maxIQ: 84,
        label: "Below Average",
      },
      {
        subjectId: null,
        minScorePercentage: 40,
        maxScorePercentage: 59,
        minIQ: 85,
        maxIQ: 99,
        label: "Low Average",
      },
      {
        subjectId: null,
        minScorePercentage: 60,
        maxScorePercentage: 74,
        minIQ: 100,
        maxIQ: 114,
        label: "Average",
      },
      {
        subjectId: null,
        minScorePercentage: 75,
        maxScorePercentage: 84,
        minIQ: 115,
        maxIQ: 129,
        label: "Above Average",
      },
      {
        subjectId: null,
        minScorePercentage: 85,
        maxScorePercentage: 94,
        minIQ: 130,
        maxIQ: 144,
        label: "Superior",
      },
      {
        subjectId: null,
        minScorePercentage: 95,
        maxScorePercentage: 100,
        minIQ: 145,
        maxIQ: 160,
        label: "Genius",
      },
    ];

    for (const grade of defaultGrades) {
      await db.insert(schema.iqGrades).values(grade);
      console.log(`✅ Created IQ grade: ${grade.label} (${grade.minScorePercentage}-${grade.maxScorePercentage}% → IQ ${grade.minIQ}-${grade.maxIQ})`);
    }

    console.log("\n✨ Default IQ grade ranges created successfully!");
    console.log("\n📝 Summary:");
    console.log("   - 6 global IQ grade ranges configured");
    console.log("   - Ranges from 'Below Average' to 'Genius'");
    console.log("   - Admin can customize these ranges or add subject-specific grades");

  } catch (error) {
    console.error("❌ Error seeding IQ grades:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedIQGrades();
