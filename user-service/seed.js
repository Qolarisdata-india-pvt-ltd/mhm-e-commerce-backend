import bcrypt from "bcrypt";
import sequelize from "./config/db.js";
import User from "./models/User.js";
import Address from "./models/Address.js";
import defineAssociations from "./models/associations.js";
import dotenv from "dotenv";

dotenv.config();

const seedUser = async () => {
  try {
    await sequelize.authenticate();
    defineAssociations();
    await sequelize.sync();

    const seedPassword = process.env.SEED_PASSWORD;
    if (!seedPassword) {
      throw new Error(
        "Missing SEED_PASSWORD in environment. Refusing to seed with a hardcoded password.",
      );
    }

    const email = process.env.SEED_USER_EMAIL || "customer@test.com";
    const phone = process.env.SEED_USER_PHONE || "9112233449";
    const name = process.env.SEED_USER_NAME || "Test Customer";
    const hashedPassword = await bcrypt.hash(seedPassword, 10);

    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "user",
      },
    });

    await Address.findOrCreate({
      where: { userId: user.id, isDefault: true },
      defaults: {
        userId: user.id,
        fullName: name,
        phone,
        addressLine1: process.env.SEED_ADDRESS_LINE1 || "123 Test Street",
        area: process.env.SEED_ADDRESS_AREA || "Vijay Nagar",
        city: process.env.SEED_ADDRESS_CITY || "Indore",
        state: process.env.SEED_ADDRESS_STATE || "Madhya Pradesh",
        pincode: process.env.SEED_ADDRESS_PINCODE || "452010",
        isDefault: true,
      },
    });

    console.log(`✅ User & Address seeded successfully! (${email} / <from env>)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ User Seeding Error:", error);
    process.exit(1);
  }
};

seedUser();
