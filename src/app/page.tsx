import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, HeartHandshake, CheckCircle2, Users, Coins, HelpCircle } from "lucide-react";
import { getCampaigns } from "@/lib/actions/campaigns";
import { getAdminDashboardStats } from "@/lib/actions/settings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CampaignCard from "@/components/CampaignCard";

export const revalidate = 60; // Cache page for 60 seconds

export default async function HomePage() {
  // Fetch featured campaigns and platform statistics
  const campaigns = await getCampaigns({ status: "active" });
  const featuredCampaigns = campaigns.slice(0, 3);
  const stats = await getAdminDashboardStats();

  const steps = [
    {
      num: "01",
      title: "Offline Application",
      desc: "Borrowers submit detailed requests offline with NID, address, and loan purpose proofs.",
    },
    {
      num: "02",
      title: "Admin Due Diligence",
      desc: "Admin verifies identity, documents, and real need before creating a campaign.",
    },
    {
      num: "03",
      title: "Crowdfunding",
      desc: "Donors contribute interest-free. Payments are sent externally; slips are uploaded for verification.",
    },
    {
      num: "04",
      title: "Direct Disbursement",
      desc: "100% of approved donor contributions go to the borrower without any fees.",
    },
    {
      num: "05",
      title: "Repayment Tracking",
      desc: "Borrower repays the loan. Donors track repayment logs and reuse returned funds.",
    },
  ];

  const faqs = [
    {
      q: "What is Qard Hasan?",
      a: "Qard Hasan is an interest-free loan (benevolent loan) mandated in Islamic ethics. The borrower is only required to repay the exact principal amount borrowed, without any interest, markup, or admin fees.",
    },
    {
      q: "How does the manual payment verification work?",
      a: "To avoid high gateway fees and ensure 100% of your funds go to the borrower, you transfer money externally using bKash, Nagad, Rocket, or Bank Transfer, and upload a screenshot/Transaction ID on our platform. An administrator manually verifies the transaction and approves your contribution.",
    },
    {
      q: "Are there any platform fees?",
      a: "No. Goodly Loan does not charge interest, nor do we take percentages from loan campaigns. The platform is supported separately by direct operational donations.",
    },
    {
      q: "What happens when the borrower repays?",
      a: "Repayments are logged by administrators. As a donor, you can track the repayment status. Once repaid, you can download your receipt and know that the community has successfully recycled the funds to empower others.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-green-50/60 via-white to-slate-50 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Hero Copy */}
              <div className="lg:col-span-7 text-left space-y-6">
                <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200/80 rounded-full px-3.5 py-1 text-xs font-semibold text-green-700">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Verified Shariah-Compliant Benevolent Loans</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Empowering Communities Through <span className="text-green-600">Interest-Free</span> Lending
                </h1>
                <p className="text-lg text-slate-600 max-w-xl">
                  Fund verified borrower campaigns directly via Qard Hasan. Full transparency, zero interest, 
                  and clear repayment tracking. Join us in cultivating ethical mutual aid.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="/campaigns"
                    className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-md shadow-green-600/10 transition hover:bg-green-700"
                  >
                    <span>Fund a Verified Interest-Free Loan</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Learn How It Works
                  </Link>
                </div>
              </div>

              {/* Hero Visual Card */}
              <div className="lg:col-span-5 relative">
                <div className="absolute inset-0 bg-green-200 rounded-2xl filter blur-3xl opacity-30 transform -rotate-6" />
                <div className="relative border border-slate-200 bg-white rounded-2xl p-6 shadow-premium max-w-md mx-auto space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <span className="font-bold text-slate-800 text-sm">Transparency Promise</span>
                    <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-sm">100% Direct</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Identity & Need Verified</h4>
                        <p className="text-xs text-slate-500">Every campaign is audited offline by admins before creation.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Manual Proof Upload</h4>
                        <p className="text-xs text-slate-500">No automatic processing fees. Proofs are verified manually.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Real-Time Repayments</h4>
                        <p className="text-xs text-slate-500">Log repayment events publicly so donors track exactly how funds return.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Repayment Rate</p>
                    <p className="text-3xl font-extrabold text-green-600">{stats.repaymentRate}%</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-slate-900 py-10 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 border-r border-slate-800 last:border-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-green-400">৳{stats.totalFundsRaised.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Total Funds Raised</p>
              </div>
              <div className="p-4 border-r border-slate-800 last:border-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-green-400">৳{stats.totalFundsRepaid.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Total Repaid</p>
              </div>
              <div className="p-4 border-r border-slate-800 last:border-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-green-400">{stats.totalDonors}</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Active Donors</p>
              </div>
              <div className="p-4">
                <p className="text-2xl sm:text-3xl font-extrabold text-green-400">{stats.totalCampaigns}</p>
                <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">Total Campaigns</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Campaigns */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                  Featured Campaigns
                </h2>
                <p className="mt-3 text-base text-slate-500">
                  Select a verified case to fund. 100% of your contribution goes to interest-free financing.
                </p>
              </div>
              <Link
                href="/campaigns"
                className="mt-4 md:mt-0 inline-flex items-center text-green-600 font-bold hover:text-green-700"
              >
                <span>View All Campaigns</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {featuredCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredCampaigns.map((campaign: any) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center">
                <p className="text-slate-500 font-medium">No active fundraising campaigns available at this moment.</p>
                <Link href="/campaigns" className="mt-4 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  Explore Directory
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-slate-100 py-16 sm:py-24 border-t border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                How Qard Hasan Crowdfunding Works
              </h2>
              <p className="mt-4 text-slate-500">
                A structured, offline-verified pipeline built to maintain trust, transparency, and high loan recovery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
              {steps.map((step, idx) => (
                <div key={idx} className="relative bg-white rounded-xl p-6 border border-slate-200 flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-4xl font-black text-green-100 block mb-2">{step.num}</span>
                    <h3 className="font-bold text-slate-800 text-base mb-2">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Qard Hasan */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  The Ethics of Qard Hasan
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm">
                  Qard Hasan represents a highly rewarded financial contract in Islamic ethical law. 
                  Unlike conventional microfinance models that trap borrowers under high-interest compounds, 
                  Qard Hasan relies on donor compassion.
                </p>
                <div className="border-l-4 border-green-600 pl-4 italic text-xs text-slate-500">
                  &ldquo;Who is it that would loan Allah a goodly loan so He may multiply it for him many times over? And it is Allah who restricts and releases, and to Him you will be returned.&rdquo; <br/>
                  <span className="font-semibold block mt-1">— Surah Al-Baqarah 2:245</span>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                  <h3 className="font-bold text-slate-800 mb-2">Social Solidarity</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Provides zero-cost cash flow directly to struggling families or micro-entrepreneurs. 
                    Empowers self-sufficiency over dependency.
                  </p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                  <h3 className="font-bold text-slate-800 mb-2">Fund Recycling</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Unlike standard charity, repayments return to the platform pool. They can be re-allocated 
                    to newer cases, multiplying the initial donation impact.
                  </p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                  <h3 className="font-bold text-slate-800 mb-2">Dignity First</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Borrowers are treated as active contract partners, building their credit history 
                    and community reputation, rather than passive aid recipients.
                  </p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                  <h3 className="font-bold text-slate-800 mb-2">No Hidden Costs</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Donors receive full assurance that no interest margins are calculated. 100% of what is 
                    repaid goes straight to restoring original pools.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-slate-100 py-16 sm:py-24 border-t border-slate-200">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                    <HelpCircle className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{faq.q}</span>
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-green-600 py-16 text-white text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to make a lasting ethical impact?
            </h2>
            <p className="text-lg text-green-100 max-w-xl mx-auto">
              Help verified borrowers launch businesses, pay medical expenses, or cover tuition fees 
              completely interest-free.
            </p>
            <div className="pt-2">
              <Link
                href="/campaigns"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-slate-800 transition"
              >
                <span>Fund a Verified Interest-Free Loan</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
