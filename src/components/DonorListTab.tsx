"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCampaignDonors } from "@/lib/actions/donor-repayment";
import { Users, ChevronRight, Loader2 } from "lucide-react";

interface Donor {
    contributionId: string;
    donorId: string;
    donorName: string;
    donorEmail: string;
    contributedAmount: number;
    totalRepaid: number;
}

export default function DonorListTab({ campaignId }: { campaignId: string }) {
    const [donors, setDonors] = useState<Donor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCampaignDonors(campaignId).then((data) => {
            setDonors(data);
            setLoading(false);
        });
    }, [campaignId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading donors...</span>
            </div>
        );
    }

    if (!donors.length) {
        return (
            <p className="text-sm text-slate-400 py-10 text-center italic">
                No approved donors yet.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                    Approved Donors ({donors.length})
                </h3>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {donors.map((d) => {
                    const repaidPercent =
                        d.contributedAmount > 0
                            ? Math.min(100, Math.round((d.totalRepaid / d.contributedAmount) * 100))
                            : 0;
                    const fullyRepaid = repaidPercent >= 100;

                    return (
                        <Link
                            key={d.donorId}
                            href={`/admin/campaigns/${campaignId}/donors/${d.donorId}`}
                            className="flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition group"
                        >
                            <div className="space-y-2 flex-1 mr-4">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-slate-800 text-sm">{d.donorName}</p>
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fullyRepaid
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}
                                    >
                                        {fullyRepaid ? "Fully Repaid" : `${repaidPercent}% repaid`}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">{d.donorEmail}</p>
                                <div className="flex items-center gap-4">
                                    <span className="text-[11px] text-slate-500">
                                        Contributed:{" "}
                                        <strong className="text-slate-700">
                                            ৳{d.contributedAmount.toLocaleString()}
                                        </strong>
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        Released:{" "}
                                        <strong className="text-green-600">
                                            ৳{d.totalRepaid.toLocaleString()}
                                        </strong>
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                        Remaining:{" "}
                                        <strong className="text-rose-600">
                                            ৳{(d.contributedAmount - d.totalRepaid).toLocaleString()}
                                        </strong>
                                    </span>
                                </div>
                                {/* Per-donor progress bar */}
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-48">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${repaidPercent}%` }}
                                    />
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-green-600 transition shrink-0" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}