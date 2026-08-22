import bcrypt from "bcrypt";
import sequelize from "./config/db.js";
import vendorModel from "./models/vendor.js";
import dotenv from "dotenv";

dotenv.config();

const seedVendor = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const seedPassword = process.env.SEED_PASSWORD;
    if (!seedPassword) {
      throw new Error(
        "Missing SEED_PASSWORD in environment. Refusing to seed with a hardcoded password.",
      );
    }

    const email = process.env.SEED_VENDOR_EMAIL || "vendor@test.com";
    const phone = process.env.SEED_VENDOR_PHONE || "9876543210";
    const name = process.env.SEED_VENDOR_NAME || "Test Vendor";
    const hashedPassword = await bcrypt.hash(seedPassword, 10);

    await vendorModel.findOrCreate({
      where: { email },
      defaults: {
        name,
        email,
        phone,
        password: hashedPassword,
        businessName: process.env.SEED_VENDOR_BUSINESS_NAME || "SuperMart Retail",
        businessType: process.env.SEED_VENDOR_BUSINESS_TYPE || "Electronics & Fashion",
        businessDescription:
          process.env.SEED_VENDOR_BUSINESS_DESCRIPTION ||
          "A trusted local business providing quality goods.",
        yearsInBusiness: Number(process.env.SEED_VENDOR_YEARS || 5),
        businessAddress:
          process.env.SEED_VENDOR_ADDRESS ||
          "456 Market Square, Vijay Nagar, Indore",
        aadharNumber: process.env.SEED_VENDOR_AADHAR || "[Aadhaar Redacted]",
        panNumber: process.env.SEED_VENDOR_PAN || "ABCDE1234F",
        gstNumber: process.env.SEED_VENDOR_GST || "23AAAAA0000A1Z5",
        bankAccountHolderName:
          process.env.SEED_VENDOR_BANK_HOLDER || "Test Vendor Store",
        bankAccountNumber:
          process.env.SEED_VENDOR_BANK_ACCOUNT || "0000123456789",
        bankIFSC: process.env.SEED_VENDOR_BANK_IFSC || "HDFC0001234",
        bankName: process.env.SEED_VENDOR_BANK_NAME || "HDFC Bank",
        status: "APPROVED",
      },
    });

    console.log(
      `✅ Vendor seeded successfully with full Business & KYC details! (${email} / <from env>)`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Vendor Seeding Error:", error);
    process.exit(1);
  }
};

seedVendor();
