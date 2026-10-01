import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  // Addresses the site is served from, besides BETTER_AUTH_URL
  trustedOrigins: ["https://goodlyloan.com", "https://www.goodlyloan.com", "https://goodlyloan-3.vercel.app"],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "DONOR",
        required: false,
        input: false, // Prevents donors from setting themselves as admins during signup
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache
    },
  },
});
