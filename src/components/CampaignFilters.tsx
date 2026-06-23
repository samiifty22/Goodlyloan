"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, RefreshCw } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CampaignFiltersProps {
  categories: Category[];
}

export default function CampaignFilters({ categories }: CampaignFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load initial states from URL search params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "all");
  const [selectedSort, setSelectedSort] = useState(searchParams.get("sort") || "latest");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

  const applyFilters = (updates: {
    search?: string;
    status?: string;
    sort?: string;
    category?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update keys
    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search);
      else params.delete("search");
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all") params.set("status", updates.status);
      else params.delete("status");
    }

    if (updates.sort !== undefined) {
      if (updates.sort) params.set("sort", updates.sort);
      else params.delete("sort");
    }

    if (updates.category !== undefined) {
      if (updates.category && updates.category !== "all") params.set("category", updates.category);
      else params.delete("category");
    }

    router.push(`/campaigns?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setSelectedSort("latest");
    setSelectedCategory("all");
    router.push("/campaigns");
  };

  const statuses = [
    { label: "All Campaigns", value: "all" },
    { label: "Active Funding", value: "active" },
    { label: "Fully Funded", value: "funded" },
    { label: "Repaying", value: "repayment" },
    { label: "Completed", value: "completed" },
  ];

  const sorts = [
    { label: "Latest First", value: "latest" },
    { label: "Most Funded", value: "most-funded" },
    { label: "Most Urgent", value: "most-urgent" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-premium space-y-6">
      
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaign titles..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition"
        >
          Search
        </button>
      </form>

      {/* Category Tabs */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setSelectedCategory("all");
              applyFilters({ category: "all" });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
              selectedCategory === "all"
                ? "bg-slate-900 border-slate-900 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.slug);
                applyFilters({ category: cat.slug });
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                selectedCategory === cat.slug
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Status & Sort Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        
        {/* Status selection */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Funding Status</h4>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((stat) => (
              <button
                key={stat.value}
                onClick={() => {
                  setSelectedStatus(stat.value);
                  applyFilters({ status: stat.value });
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                  selectedStatus === stat.value
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {stat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort selection */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sort By</h4>
          <div className="flex gap-2">
            <select
              value={selectedSort}
              onChange={(e) => {
                setSelectedSort(e.target.value);
                applyFilters({ sort: e.target.value });
              }}
              className="flex-grow text-xs font-semibold bg-white border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {sorts.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleClearFilters}
              title="Reset Filters"
              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 p-2 rounded-md transition flex items-center justify-center shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
