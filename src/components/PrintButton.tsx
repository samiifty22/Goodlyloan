"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4.5 py-2 rounded-lg text-xs transition cursor-pointer"
    >
      <Printer className="h-4 w-4" />
      <span>Print Receipt</span>
    </button>
  );
}
