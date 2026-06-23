import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import {
  getDonorDashboardStats,
  getDonorNotifications,
} from "@/lib/actions/settings";

import { getDonorContributions } from "@/lib/actions/contributions";
import { getDonorRepaymentHistory } from "@/lib/actions/donor-repayment";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  Heart,
  Coins,
  FolderHeart,
  BadgeAlert,
  Bell,
  ExternalLink,
  Printer,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";


interface RepaymentEntry {
  id: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  repaymentDate: string;

  campaign: {
    id: string;
    title: string;
    slug: string;
  } | null;

  receipt: {
    id: string;
    receiptNumber: string;
  } | null;
}



async function DonorRepaymentHistory({
  donorId,
}: {
  donorId: string;
}) {

  const history: RepaymentEntry[] =
    await getDonorRepaymentHistory(donorId);


  const totalReceived = history.reduce(
    (sum, item) => sum + item.amount,
    0
  );


  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm">

      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div className="flex items-center gap-2">

          <TrendingUp className="h-5 w-5 text-green-600" />

          <h3 className="text-lg font-bold text-slate-900">
            Disbursement History
          </h3>

          <span className="text-xs text-slate-400">
            — amounts repaid back to you
          </span>

        </div>


        {
          history.length > 0 && (

            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">

              <p className="text-[10px] uppercase font-bold text-green-600">
                Total Received
              </p>


              <p className="text-lg font-black text-green-700">
                ৳{totalReceived.toLocaleString()}
              </p>

            </div>

          )
        }

      </div>



      {
        history.length === 0 ? (

          <div className="py-14 text-center">

            <TrendingUp className="h-10 w-10 text-slate-200 mx-auto" />

            <p className="text-sm font-semibold text-slate-400 mt-2">
              No disbursements yet
            </p>

            <p className="text-xs text-slate-300">
              Repayments received from borrowers will appear here.
            </p>

          </div>


        ) : (


          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-slate-100 text-xs">


              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-3 text-left">
                    Campaign
                  </th>


                  <th className="px-5 py-3 text-right">
                    Amount Received
                  </th>


                  <th className="px-5 py-3 text-left">
                    Note
                  </th>


                  <th className="px-5 py-3 text-left">
                    Date
                  </th>


                  <th className="px-5 py-3 text-center">
                    Receipt
                  </th>

                </tr>

              </thead>



              <tbody className="divide-y divide-slate-100">


                {
                  history.map((item) => (

                    <tr
                      key={item.id}
                      className="hover:bg-slate-50"
                    >


                      <td className="px-5 py-3 font-semibold">

                        {
                          item.campaign ? (

                            <Link
                              href={`/campaigns/${item.campaign.slug}`}
                              className="flex items-center gap-1 text-green-600"
                            >

                              {item.campaign.title}

                              <ExternalLink
                                className="h-3 w-3"
                              />

                            </Link>

                          ) : (

                            "Archived Campaign"

                          )
                        }

                      </td>



                      <td className="px-5 py-3 text-right font-bold text-green-600">

                        ৳{item.amount.toLocaleString()}

                      </td>



                      <td className="px-5 py-3 text-slate-500">

                        {item.notes || "-"}

                      </td>



                      <td className="px-5 py-3">

                        {
                          new Date(
                            item.repaymentDate
                          ).toLocaleDateString()
                        }

                      </td>



                      <td className="px-5 py-3 text-center">


                        {
                          item.receipt ? (

                            <Link
                              href={`/repayment-receipt/${item.receipt.id}`}
                              target="_blank"
                              className="text-green-600 font-bold"
                            >

                              <Printer className="inline h-3 w-3" />

                              {item.receipt.receiptNumber}

                            </Link>

                          ) : (

                            "-"

                          )
                        }


                      </td>


                    </tr>


                  ))
                }


              </tbody>


            </table>


          </div>

        )
      }


    </div>
  );
}



export default async function DonorDashboardPage() {


  const session = await auth.api.getSession({
    headers: await headers(),
  });


  if (!session) {
    redirect("/login");
  }


  const userId = session.user.id;



  const [
    stats,
    contributions,
    notifications
  ] = await Promise.all([

    getDonorDashboardStats(userId),

    getDonorContributions(userId),

    getDonorNotifications(userId),

  ]);



  const statusColors: Record<string, string> = {

    PENDING:
      "bg-amber-100 text-amber-800 border-amber-200",

    APPROVED:
      "bg-green-100 text-green-800 border-green-200",

    REJECTED:
      "bg-rose-100 text-rose-800 border-rose-200",

    CANCELLED:
      "bg-slate-100 text-slate-700 border-slate-200",

  };



  return (
    <div className="flex min-h-screen flex-col bg-slate-50">

      <Navbar />


      <main className="flex-grow py-10">

        <div className="mx-auto max-w-7xl px-4 space-y-8">
          {/* Welcome Banner */}

          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div>

              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Welcome back, {session.user.name}!
              </h1>


              <p className="text-slate-400 text-sm mt-2 max-w-md">
                Thank you for supporting benevolent interest-free loans.
                Review your contributions and repayment progress here.
              </p>

            </div>



            <div className="flex gap-3">

              <Link
                href="/donor/dashboard/profile"
                className="border border-white/20 px-5 py-3 rounded-lg text-sm font-semibold hover:bg-white/10"
              >
                My Profile
              </Link>


              <Link
                href="/campaigns"
                className="bg-green-600 px-5 py-3 rounded-lg text-sm font-semibold hover:bg-green-700"
              >
                Explore Campaigns
              </Link>


            </div>


          </div>



          {/* Stats */}

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">


            <StatCard
              icon={<Coins />}
              title="Total Contributed"
              value={`৳${stats.totalContributions.toLocaleString()}`}
            />


            <StatCard
              icon={<FolderHeart />}
              title="Supported Campaigns"
              value={stats.campaignsSupported}
            />


            <StatCard
              icon={<Heart />}
              title="Active Projects"
              value={stats.activeCampaignsSupported}
            />


            <StatCard
              icon={<Coins />}
              title="Received Back"
              value={`৳${stats.totalRepaidReceived.toLocaleString()}`}
            />


            <StatCard
              icon={<BadgeAlert />}
              title="Completed Loans"
              value={stats.completedCampaignsSupported}
            />


          </div>




          {/* Repayment History */}

          <DonorRepaymentHistory donorId={userId} />





          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">


            {/* Contributions */}

            <div className="lg:col-span-8 bg-white border rounded-xl p-6">


              <h3 className="text-lg font-bold border-b pb-3 mb-4">
                Contribution History
              </h3>



              {
                contributions.length > 0 ? (

                  <div className="overflow-x-auto">


                    <table className="min-w-full text-xs">


                      <thead className="bg-slate-50">

                        <tr>

                          <th className="p-3 text-left">
                            Campaign
                          </th>

                          <th className="p-3 text-right">
                            Amount
                          </th>


                          <th className="p-3">
                            Status
                          </th>


                          <th className="p-3">
                            Date
                          </th>


                          <th className="p-3">
                            Receipt
                          </th>

                        </tr>


                      </thead>




                      <tbody>


                        {
                          contributions.map((con: any) => (


                            <tr
                              key={con.id}
                              className="border-b"
                            >


                              <td className="p-3 font-semibold">


                                {
                                  con.campaign ? (

                                    <Link
                                      href={`/campaigns/${con.campaign.slug}`}
                                      className="text-green-600 flex gap-1"
                                    >

                                      {con.campaign.title}

                                      <ExternalLink className="h-3 w-3" />

                                    </Link>

                                  ) : (

                                    "Archived Campaign"

                                  )
                                }


                              </td>



                              <td className="p-3 text-right font-bold">

                                ৳{con.amount.toLocaleString()}

                              </td>




                              <td className="p-3 text-center">

                                <span
                                  className={`rounded-full border px-2 py-1 text-[10px] ${statusColors[con.status]
                                    }`}
                                >

                                  {con.status}

                                </span>


                              </td>




                              <td className="p-3">

                                {
                                  new Date(
                                    con.createdAt
                                  ).toLocaleDateString()
                                }

                              </td>




                              <td className="p-3 text-center">


                                {
                                  con.receipt ? (

                                    <Link
                                      href={`/receipt/${con.receipt.id}`}
                                      target="_blank"
                                      className="text-green-600 font-bold"
                                    >

                                      <Printer className="inline h-3 w-3" />

                                      Print

                                    </Link>


                                  ) : "-"

                                }


                              </td>



                            </tr>


                          ))
                        }



                      </tbody>



                    </table>



                  </div>


                ) : (


                  <p className="text-center text-slate-400 py-10">
                    No contributions found.
                  </p>


                )
              }



            </div>





            {/* Notifications */}


            <div className="lg:col-span-4 bg-white border rounded-xl p-6">


              <div className="flex items-center gap-2 border-b pb-3 mb-4">


                <Bell className="text-green-600" />

                <h3 className="font-bold">
                  Notifications
                </h3>


              </div>




              {
                notifications.length > 0 ? (

                  notifications.map((n: any) => (


                    <div
                      key={n.id}
                      className="border rounded-lg p-3 mb-3 text-sm"
                    >

                      <p className="font-bold">
                        {n.title}
                      </p>


                      <p className="text-slate-500">
                        {n.message}
                      </p>


                      <small className="text-slate-400">

                        {
                          new Date(
                            n.createdAt
                          ).toLocaleString()
                        }

                      </small>


                    </div>


                  ))


                ) : (

                  <p className="text-sm text-slate-400 text-center">
                    No notifications.
                  </p>

                )
              }



            </div>



          </div>


        </div>


      </main>



      <Footer />

    </div>
  );
}





function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) {

  return (

    <div className="bg-white border rounded-xl p-5 flex items-center gap-4">


      <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">

        {icon}

      </div>



      <div>


        <p className="text-[10px] text-slate-400 uppercase font-bold">
          {title}
        </p>


        <p className="text-lg font-black text-slate-800">
          {value}
        </p>


      </div>


    </div>

  );

}