"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Heart, User, LayoutDashboard, Settings, Coins, FileCheck } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isLoggedIn = !!session;
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Home/Campaigns tabs temporarily disabled — landing page only, logo already links home
  const navLinks: { name: string; href: string }[] = [
    // { name: "Home", href: "/" },
    // { name: "Campaigns", href: "/campaigns" },
  ];

  const adminLinks = [
    { name: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Manage Campaigns", href: "/admin/campaigns", icon: Coins },
    { name: "Contributions", href: "/admin/contributions", icon: FileCheck },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const donorLinks = [
    { name: "Donor Dashboard", href: "/donor/dashboard", icon: LayoutDashboard },
    { name: "My Profile", href: "/donor/dashboard/profile", icon: User },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-center md:justify-between">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center">
            <Link href="/" className="flex items-center space-x-2 transition-opacity duration-200 hover:opacity-80">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white shadow-md shadow-green-600/20">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
                Goodly<span className="text-green-600">Loan</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${isActive(link.href)
                  ? "border-b-2 border-green-600 text-slate-900"
                  : "text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            {isLoggedIn &&
              !isAdmin &&
              donorLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${isActive(link.href)
                    ? "border-b-2 border-green-600 text-slate-900"
                    : "text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                >
                  {link.name}
                </Link>
              ))}

            {isLoggedIn &&
              isAdmin &&
              adminLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${isActive(link.href)
                    ? "border-b-2 border-green-600 text-slate-900"
                    : "text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                >
                  {link.name}
                </Link>
              ))}
          </div>

          {/* Right menu (Auth control) — temporarily disabled while sign-in is paused
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isPending ? (
              <div className="h-8 w-24 animate-pulse rounded-md bg-slate-100" />
            ) : isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800 leading-tight">{session.user.name}</p>
                    <p className="text-slate-400 capitalize">{((session.user as any).role)?.toLowerCase()}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center space-x-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                Sign In
              </Link>
            )}
          </div>
          */}
        </div>
      </div>
    </nav>
  );
}
