"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to convert Prisma Decimal to Number for clean serialization
function serializeCampaign(campaign: any) {
  if (!campaign) return null;
  return {
    ...campaign,
    loanAmountRequired: Number(campaign.loanAmountRequired),
    raisedAmount: Number(campaign.raisedAmount),
    disbursedAmount: Number(campaign.disbursedAmount),
    totalRepaid: Number(campaign.totalRepaid),
    borrower: campaign.borrower
      ? {
        ...campaign.borrower,
        loanAmountRequested: Number(campaign.borrower.loanAmountRequested),
      }
      : null,
    contributions: campaign.contributions
      ? campaign.contributions.map((c: any) => ({
        ...c,
        amount: Number(c.amount),
      }))
      : [],
    repayments: campaign.repayments
      ? campaign.repayments.map((r: any) => ({
        ...r,
        amount: Number(r.amount),
      }))
      : [],
  };
}

export async function getCategories() {
  try {
    return await db.category.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategory(name: string) {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const category = await db.category.create({
      data: { name, slug },
    });
    return { success: true, category };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create category" };
  }
}

interface CampaignFilterOptions {
  search?: string;
  status?: string; // "active", "funded", "repayment", "completed" or "all"
  sort?: string;   // "latest", "most-funded", "most-urgent"
  category?: string;
}

export async function getCampaigns(options: CampaignFilterOptions = {}) {
  try {
    const { search, status, sort, category } = options;

    let whereClause: any = {};

    // Search filter
    if (search) {
      whereClause.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Status filter
    if (status && status !== "all") {
      if (status === "active") {
        whereClause.status = "ACTIVE_FUNDING";
      } else if (status === "funded") {
        whereClause.status = "FULLY_FUNDED";
      } else if (status === "repayment") {
        whereClause.status = "REPAYMENT_ACTIVE";
      } else if (status === "completed") {
        whereClause.status = "COMPLETED";
      }
    } else {
      // By default show active funding, fully funded, repayment active, and completed campaigns
      whereClause.status = {
        in: ["ACTIVE_FUNDING", "FULLY_FUNDED", "DISBURSED", "REPAYMENT_ACTIVE", "COMPLETED"],
      };
    }

    // Category filter
    if (category) {
      whereClause.category = {
        slug: category,
      };
    }

    // Sorting
    let orderByClause: any = { createdAt: "desc" };
    if (sort === "most-funded") {
      orderByClause = { raisedAmount: "desc" };
    } else if (sort === "most-urgent") {
      // Urgent can mean remaining amount is low or high status priority
      orderByClause = { loanAmountRequired: "desc" };
    }

    const campaigns = await db.campaign.findMany({
      where: whereClause,
      include: {
        category: true,
        borrower: true,
      },
      orderBy: orderByClause,
    });

    return campaigns.map(serializeCampaign);
  } catch (error) {
    console.error("Error getting campaigns:", error);
    return [];
  }
}

export async function getCampaignBySlug(slug: string) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { slug },
      include: {
        category: true,
        borrower: true,
        updates: {
          orderBy: { createdAt: "desc" },
        },
        contributions: {
          where: { status: "APPROVED" },
          include: {
            donor: {
              select: { name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        repayments: {
          orderBy: { repaymentDate: "desc" },
        },
      },
    });

    return serializeCampaign(campaign);
  } catch (error) {
    console.error("Error getting campaign by slug:", error);
    return null;
  }
}

export async function getAdminCampaigns() {
  try {
    const campaigns = await db.campaign.findMany({
      include: {
        category: true,
        borrower: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return campaigns.map(serializeCampaign);
  } catch (error) {
    console.error("Error getting admin campaigns:", error);
    return [];
  }
}

interface CreateCampaignInput {
  title: string;
  categoryId: string;
  shortDescription: string;
  fullStory: string;
  loanAmountRequired: number;
  expectedRepaymentDuration: string;
  coverImage: string;
  riskLevel: string; // "LOW", "MEDIUM", "HIGH"

  // Borrower Info
  borrowerName: string;
  borrowerPhone: string;
  borrowerAddress: string;
  borrowerOccupation: string;
  borrowerNid: string;
  borrowerPurpose: string;
  borrowerRepaymentPlan: string;
  borrowerNotes?: string;
  adminId?: string;
  adminEmail?: string;
}

export async function createCampaign(data: CreateCampaignInput) {
  try {
    // Generate unique slug
    let slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Ensure uniqueness of slug
    const slugExists = await db.campaign.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // 1. Create Borrower internally
    const borrower = await db.borrower.create({
      data: {
        fullName: data.borrowerName,
        phoneNumber: data.borrowerPhone,
        address: data.borrowerAddress,
        occupation: data.borrowerOccupation,
        nidNumber: data.borrowerNid,
        purposeOfLoan: data.borrowerPurpose,
        loanAmountRequested: data.loanAmountRequired,
        repaymentPlan: data.borrowerRepaymentPlan,
        internalNotes: data.borrowerNotes,
      },
    });

    // 2. Create Campaign linked to Borrower
    const campaign = await db.campaign.create({
      data: {
        title: data.title,
        slug,
        categoryId: data.categoryId,
        shortDescription: data.shortDescription,
        fullStory: data.fullStory,
        loanAmountRequired: data.loanAmountRequired,
        expectedRepaymentDuration: data.expectedRepaymentDuration,
        coverImage: data.coverImage,
        riskLevel: data.riskLevel,
        status: "DRAFT", // Default status
        borrowerId: borrower.id,
        verificationStatus: "VERIFIED",
        identityVerified: true,
        needVerified: true,
        documentsVerified: true,
        adminApproved: true,
      },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: data.adminId,
        userEmail: data.adminEmail || "Admin",
        action: "CAMPAIGN_CREATE",
        details: `Created campaign "${data.title}" (ID: ${campaign.id}) and borrower "${data.borrowerName}"`,
      },
    });

    revalidatePath("/campaigns");
    revalidatePath("/admin/campaigns");

    return { success: true, campaign };
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return { success: false, error: error.message || "Failed to create campaign" };
  }
}

interface EditCampaignInput {
  id: string;
  title: string;
  categoryId: string;
  shortDescription: string;
  fullStory: string;
  loanAmountRequired: number;
  expectedRepaymentDuration: string;
  coverImage: string;
  riskLevel: string;
  status: string; // Draft, Active, etc.

  // Borrower Info
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerAddress: string;
  borrowerOccupation: string;
  borrowerNid: string;
  borrowerPurpose: string;
  borrowerRepaymentPlan: string;
  borrowerNotes?: string;
  adminId?: string;
  adminEmail?: string;
}

export async function editCampaign(data: EditCampaignInput) {
  try {
    // 1. Update Borrower
    await db.borrower.update({
      where: { id: data.borrowerId },
      data: {
        fullName: data.borrowerName,
        phoneNumber: data.borrowerPhone,
        address: data.borrowerAddress,
        occupation: data.borrowerOccupation,
        nidNumber: data.borrowerNid,
        purposeOfLoan: data.borrowerPurpose,
        loanAmountRequested: data.loanAmountRequired,
        repaymentPlan: data.borrowerRepaymentPlan,
        internalNotes: data.borrowerNotes,
      },
    });

    // 2. Update Campaign
    const campaign = await db.campaign.update({
      where: { id: data.id },
      data: {
        title: data.title,
        categoryId: data.categoryId,
        shortDescription: data.shortDescription,
        fullStory: data.fullStory,
        loanAmountRequired: data.loanAmountRequired,
        expectedRepaymentDuration: data.expectedRepaymentDuration,
        coverImage: data.coverImage,
        riskLevel: data.riskLevel,
        status: data.status,
      },
    });

    // Log action
    await db.auditLog.create({
      data: {
        userId: data.adminId,
        userEmail: data.adminEmail || "Admin",
        action: "CAMPAIGN_UPDATE",
        details: `Edited campaign "${data.title}" (ID: ${campaign.id})`,
      },
    });

    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${campaign.slug}`);
    revalidatePath("/admin/campaigns");

    return { success: true, campaign };
  } catch (error: any) {
    console.error("Error editing campaign:", error);
    return { success: false, error: error.message || "Failed to update campaign" };
  }
}

export async function updateCampaignStatus(id: string, status: string, adminId?: string, adminEmail?: string) {
  try {
    const campaign = await db.campaign.update({
      where: { id },
      data: { status },
    });

    // Log action
    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: adminEmail || "Admin",
        action: "CAMPAIGN_STATUS_CHANGE",
        details: `Updated campaign "${campaign.title}" status to ${status}`,
      },
    });

    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${campaign.slug}`);
    revalidatePath("/admin/campaigns");

    return { success: true, campaign };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update campaign status" };
  }
}
export async function setCampaignStatus(
  id: string,
  status: string,
  adminId?: string,
  adminEmail?: string
) {
  try {
    const campaign = await db.campaign.update({
      where: { id },
      data: { status },
    });

    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: adminEmail || "Admin",
        action: "CAMPAIGN_STATUS_CHANGE",
        details: `Manually changed campaign "${campaign.title}" status to "${status}"`,
      },
    });

    // Notify donors on key transitions
    const notifyStatuses = ["ACTIVE_FUNDING", "REPAYMENT_ACTIVE", "COMPLETED", "CLOSED"];
    if (notifyStatuses.includes(status)) {
      const donors = await db.contribution.findMany({
        where: { campaignId: id, status: "APPROVED" },
        select: { donorId: true },
        distinct: ["donorId"],
      });

      const statusMessages: Record<string, string> = {
        ACTIVE_FUNDING: `"${campaign.title}" is now live and accepting donations.`,
        REPAYMENT_ACTIVE: `"${campaign.title}" has entered the repayment phase.`,
        COMPLETED: `"${campaign.title}" has been fully repaid. JazakAllahu Khayran!`,
        CLOSED: `"${campaign.title}" has been closed.`,
      };

      for (const donor of donors) {
        await db.notification.create({
          data: {
            userId: donor.donorId,
            title: `Campaign Status Update`,
            message: statusMessages[status] ?? `Campaign status changed to ${status}.`,
          },
        });
      }
    }

    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${campaign.slug}`);
    revalidatePath("/admin/campaigns");

    return { success: true };
  } catch (error: any) {
    console.error("Error setting campaign status:", error);
    return { success: false, error: error.message || "Failed to update status" };
  }
}