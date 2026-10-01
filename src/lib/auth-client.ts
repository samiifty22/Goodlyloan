import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // In the browser, always talk to the address the visitor is on, so sign-in works on
  // every domain the site is served from (goodlyloan.com, www, and the vercel.app URL)
  baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
