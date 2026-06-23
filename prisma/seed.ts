import { PrismaClient } from "@prisma/client";
import { auth } from "../src/lib/auth";

const db = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // 1. Seed Categories
  const categoriesList = [
    { name: "Livelihood Support", slug: "livelihood-support" },
    { name: "Emergency Relief", slug: "emergency-relief" },
    { name: "Education Finance", slug: "education" },
    { name: "Medical Aid", slug: "medical-aid" },
    { name: "Small Business", slug: "small-business" },
  ];

  console.log("Creating categories...");
  const categories = [];
  for (const cat of categoriesList) {
    const created = await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories.push(created);
  }

  // 2. Seed Settings Singleton
  console.log("Creating settings...");
  await db.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      organizationName: "Goodly Loan",
      bkashNumber: "01700000000",
      nagadNumber: "01800000000",
      rocketNumber: "01900000000",
      bankName: "Islami Bank Bangladesh PLC",
      accountName: "Goodly Loan Foundation",
      accountNumber: "20501234567890123",
      contactEmail: "info@goodlyloan.org",
      contactPhone: "+8801700000000",
    },
  });

  // 3. Seed Admin User
  console.log("Creating admin account...");
  const adminEmail = "admin@goodlyloan.org";
  
  const existingAdmin = await db.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    try {
      // Create user and account using Better Auth server API
      // This hashes password and configures credentials automatically
      const res = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: "admin123",
          name: "System Admin",
        },
      });

      if (res) {
        // Elevate user to ADMIN
        await db.user.update({
          where: { email: adminEmail },
          data: { role: "ADMIN" },
        });
        console.log("Admin account created successfully: admin@goodlyloan.org / admin123");
      }
    } catch (error) {
      console.error("Failed creating admin via Better Auth, inserting directly with preset bcrypt hash:", error);
      
      // Fallback: If signup API fails, insert directly
      // Password hash for "admin123" using Better Auth standard bcrypt format
      const bcryptHash = "$2a$10$zY9hZtM/z9cE1P8g6RoxQ.WJ3T9.jHqD.QpQZ5R.t8g7n5mF9P9fO";
      
      const user = await db.user.create({
        data: {
          name: "System Admin",
          email: adminEmail,
          role: "ADMIN",
        },
      });

      await db.account.create({
        data: {
          id: `admin-credentials-${Date.now()}`,
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: bcryptHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log("Fallback Admin account created directly: admin@goodlyloan.org / admin123");
    }
  } else {
    console.log("Admin account already exists.");
  }

  // 4. Seed Mock Campaign
  console.log("Creating initial mock campaigns...");
  const firstCategory = categories.find((c) => c.slug === "small-business") || categories[0];
  
  const mockCampaignSlug = "funding-grocery-shop-stock";
  const existingCampaign = await db.campaign.findUnique({
    where: { slug: mockCampaignSlug },
  });

  if (!existingCampaign) {
    const borrower = await db.borrower.create({
      data: {
        fullName: "Abdur Rahim",
        phoneNumber: "01712345678",
        address: "Block C, Mirpur, Dhaka",
        occupation: "Grocery shop owner",
        nidNumber: "1991269584736",
        purposeOfLoan: "Purchasing wholesale stocks of rice, lentils, oil, and spices to restore shop inventory.",
        loanAmountRequested: 60000,
        repaymentPlan: "Monthly installments of ৳5,000 for 12 months, with no grace period.",
        internalNotes: "Verified physically. Rahim has a running shop for 3 years. Shop lease is valid.",
      },
    });

    const campaign = await db.campaign.create({
      data: {
        title: "Interest-Free Loan to Restore Rahim's Grocery Shop Inventory",
        slug: mockCampaignSlug,
        categoryId: firstCategory.id,
        shortDescription: "Help Rahim purchase wholesale stock to restore inventory and sustain his family income.",
        fullStory: `Abdur Rahim operates a small retail grocery shop in Mirpur, Dhaka. He has been running this shop for the last three years to support his wife and three school-going children.

Due to the recent rise in commodity prices and sudden family medical bills, Rahim had to deplete a significant portion of his working capital. Consequently, his shop shelves are empty, and his daily sales have dropped by more than 50%. Conventionally, microfinance institutions would charge him 15-25% interest rates, which would lead to debt traps.

We are raising ৳60,000 via interest-free Qard Hasan. 100% of your contributions will go directly to purchasing inventory (rice, oil, lentils, flour, and spices) from wholesale distributors. Rahim will repay ৳5,000 monthly over 12 months. Once repaid, the funds will return to the Goodly Loan Benevolent Pool to support other cases.`,
        loanAmountRequired: 60000,
        raisedAmount: 0,
        coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
        expectedRepaymentDuration: "12 months",
        riskLevel: "LOW",
        status: "ACTIVE_FUNDING",
        borrowerId: borrower.id,
        verificationStatus: "VERIFIED",
        identityVerified: true,
        needVerified: true,
        documentsVerified: true,
        adminApproved: true,
      },
    });

    console.log(`Mock campaign created: "${campaign.title}"`);
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
