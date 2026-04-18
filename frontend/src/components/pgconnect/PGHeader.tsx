"use client";

import { Search, MapPin, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const locations = ["All Locations", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune"];
const budgets = ["Any Budget", "Under ₹5,000", "₹5,000 - ₹10,000", "₹10,000 - ₹15,000", "₹15,000 - ₹20,000", "Above ₹20,000"];

export default function PGHeader() {
  const [locationOpen, setLocationOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedBudget, setSelectedBudget] = useState("Any Budget");

  return (
    <header className="sticky top-0 z-50 bg-[#1E40AF] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top row: Brand */}
        <div className="flex items-center justify-between mb-3">
          <Link href="/pgconnect" className="text-white text-2xl font-bold tracking-tight">
            <span className="font-extrabold">PG</span>
            <span className="font-light">Connect</span>
          </Link>
          <Link
            href="/pgconnect/upload"
            className="hidden sm:inline-flex items-center gap-2 bg-white text-[#1E40AF] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            List Your Property
          </Link>
        </div>

        {/* Search bar row */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {/* Search input */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location, landmark, or PG name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {/* Location Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setLocationOpen(!locationOpen); setBudgetOpen(false); }}
              className="w-full sm:w-44 flex items-center justify-between gap-2 bg-white text-gray-700 text-sm px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span className="truncate">{selectedLocation}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
            {locationOpen && (
              <div className="absolute top-full mt-1 left-0 w-full sm:w-44 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => { setSelectedLocation(loc); setLocationOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                      selectedLocation === loc ? "text-[#1E40AF] font-semibold bg-blue-50" : "text-gray-700"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Budget Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setBudgetOpen(!budgetOpen); setLocationOpen(false); }}
              className="w-full sm:w-48 flex items-center justify-between gap-2 bg-white text-gray-700 text-sm px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <span className="truncate">{selectedBudget}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
            {budgetOpen && (
              <div className="absolute top-full mt-1 left-0 w-full sm:w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1">
                {budgets.map((b) => (
                  <button
                    key={b}
                    onClick={() => { setSelectedBudget(b); setBudgetOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                      selectedBudget === b ? "text-[#1E40AF] font-semibold bg-blue-50" : "text-gray-700"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
