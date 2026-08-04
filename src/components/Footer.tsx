import React from "react";
import Link from "next/link";
import { Heart, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2 transition-opacity duration-200 hover:opacity-80">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-white">
                Goodly<span className="text-green-500">Loan</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm">
              Goodly Loan is a Shariah-compliant Qardan Hasana (interest-free loan) crowdfunding platform.
              We empower donors to fund verified loan cases, bringing ethical, transparent, and direct
              community support.
            </p>
            <div className="flex items-center space-x-2 text-xs text-green-400 font-semibold bg-green-950/40 border border-green-900/60 rounded-full px-3 py-1.5 w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Interest-Free & Shariah Compliant</span>
            </div>
          </div>



          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex items-start space-x-2">
                <Phone className="h-4 w-4 text-green-500 mt-0.5" />
                <span>+880 1312404363</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                <span>87-89 Niketan Block B Gulshan, Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>

        </div>


      </div>
    </footer>
  );
}
