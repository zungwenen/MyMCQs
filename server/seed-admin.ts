import { db } from "./db";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedSuperAdmin() {
  try {
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
      console.log("Super admin created: username='admin', password='admin123'");
    } else {
      console.log("Super admin already exists");
    }
  } catch (error) {
    console.error("Error seeding super admin:", error);
  }
}

seedSuperAdmin();
