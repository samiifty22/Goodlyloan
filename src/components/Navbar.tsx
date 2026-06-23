"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Menu, X, Heart, LogOut, User, LayoutDashboard, Settings, Coins, FileCheck } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "ADMIN";

  const handleSignOut = async () => {
    await signOut({
      callbackURL: "/login",
    });
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Campaigns", href: "/campaigns" },
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
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white shadow-md shadow-green-600/20">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
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

          {/* Right menu (Auth control) */}
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
                    <p className="text-slate-400 capitalize">{session.user.role?.toLowerCase()}</p>
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

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(link.href)
                ? "bg-green-50 text-green-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              {link.name}
            </Link>
          ))}

          {isLoggedIn && !isAdmin && (
            <>
              <div className="border-t border-slate-100 my-2 pt-2 px-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Donor Account</p>
              </div>
              {donorLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(link.href)
                    ? "bg-green-50 text-green-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </>
          )}

          {isLoggedIn && isAdmin && (
            <>
              <div className="border-t border-slate-100 my-2 pt-2 px-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Administrator</p>
              </div>
              {adminLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 rounded-md px-3 py-2 text-base font-medium transition-colors ${isActive(link.href)
                    ? "bg-green-50 text-green-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              ))}
            </>
          )}

          <div className="border-t border-slate-100 mt-4 pt-4 px-3 flex justify-between items-center">
            {isLoggedIn ? (
              <div className="w-full space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
                    {session.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 leading-tight text-sm">{session.user.name}</p>
                    <p className="text-xs text-slate-400">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="flex w-full items-center justify-center space-x-1.5 rounded-md border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-md bg-green-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
