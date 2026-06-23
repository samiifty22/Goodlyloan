import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDonorProfile } from "@/lib/actions/donor-profile";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DonorProfileForm from "@/components/DonorProfileForm";
import Link from "next/link";
import { ArrowLeft, UserCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DonorProfilePage() {
  const headersList = await headers();

  let session;
  try {
    session = await auth.api.getSession({ headers: headersList });
  } catch (e) {
    console.error("Session error on profile page:", e);
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login?callbackUrl=/donor/profile");
  }

  let user = null;
  let paymentInfo = null;

  try {
    const result = await getDonorProfile(session.user.id);
    user = result.user;
    paymentInfo = result.paymentInfo;
  } catch (e) {
    console.error("Profile fetch error:", e);
  }

  if (!user) {
    // Show error instead of redirecting so we can see what went wrong
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="bg-white border border-rose-200 rounded-xl p-8 max-w-md text-center space-y-3">
            <p className="text-rose-600 font-bold">Could not load profile.</p>
            <p className="text-xs text-slate-500">
              This may be because the DonorPaymentInfo table does not exist yet.
              Run: <code className="bg-slate-100 px-1 rounded">npx prisma db push</code> then restart.
            </p>
            <Link href="/donor/dashboard" className="text-green-600 underline text-sm">
              Back to Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">

          <Link
            href="/donor/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-green-600 transition font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center gap-5">
            <div className="h-14 w-14 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
              <UserCircle className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{user.name}</h1>
              <p className="text-slate-400 text-sm">{user.email}</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Member since{" "}
                {new Date(user.createdAt).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {!paymentInfo?.bkashNumber &&
            !paymentInfo?.nagadNumber &&
            !paymentInfo?.rocketNumber &&
            !paymentInfo?.accountNumber && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 font-medium">
                ⚠️ You have not added any payment details yet. Admins need your payment
                info to release repayments to you. Please fill in at least one method below.
              </div>
            )}

          <DonorProfileForm
            userId={user.id}
            initialName={user.name}
            initialEmail={user.email}
            initialPaymentInfo={paymentInfo}
          />

        </div>
      </main>
      <Footer />
    </div>
  );
}