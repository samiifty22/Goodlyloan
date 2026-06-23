import React from "react";
import { getCampaigns, getCategories } from "@/lib/actions/campaigns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CampaignCard from "@/components/CampaignCard";
import CampaignFilters from "@/components/CampaignFilters";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    sort?: string;
    category?: string;
  }>;
}

export const dynamic = "force-dynamic"; // Ensure parameters trigger dynamic SSR

export default async function CampaignsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Retrieve data using server actions
  const [campaigns, categories] = await Promise.all([
    getCampaigns({
      search: params.search,
      status: params.status,
      sort: params.sort,
      category: params.category,
    }),
    getCategories(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Header Banner */}
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Campaign Directory
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Browse verified interest-free loan cases. Every contribution is tracked transparently 
              and repaid directly to restock benevolent funding pools.
            </p>
          </div>

          {/* Filtering Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* Filter Sidebar */}
            <div className="lg:col-span-1 sticky top-24">
              <CampaignFilters categories={categories} />
            </div>

            {/* Campaign Grid List */}
            <div className="lg:col-span-3">
              {campaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {campaigns.map((campaign: any) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
                  <p className="text-slate-500 font-semibold text-lg">No campaigns match your filters.</p>
                  <p className="text-sm text-slate-400 mt-1">Try resetting the filters or typing a different search query.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
