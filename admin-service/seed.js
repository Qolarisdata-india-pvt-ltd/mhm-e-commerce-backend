import bcrypt from "bcrypt";
import sequelize from "./config/db.js";
import Admin from "./models/Admin.js";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const adminName = process.env.SEED_ADMIN_NAME || "Super Admin";
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@test.com";
    const adminPhone = process.env.SEED_ADMIN_PHONE || "9999999999";
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error(
        "Missing SEED_ADMIN_PASSWORD in environment. Refusing to seed with a hardcoded password.",
      );
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await Admin.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        phone: adminPhone,
      },
    });

    console.log(`✅ Admin seeded successfully! (${adminEmail} / <from env>)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin Seeding Error:", error);
    process.exit(1);
  }
};

seedAdmin();
