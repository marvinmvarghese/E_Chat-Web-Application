"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Wifi,
  Wind,
  Zap,
  ShieldCheck,
  MapPin,
  Phone,
  MessageCircle,
  CalendarCheck,
  UtensilsCrossed,
  WashingMachine,
  ShieldCheck as SecurityIcon,
} from "lucide-react";

const images = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
];

const amenitiesList = [
  { icon: Wifi, label: "High-Speed WiFi" },
  { icon: Wind, label: "Air Conditioning" },
  { icon: Zap, label: "Power Backup" },
  { icon: WashingMachine, label: "Laundry" },
  { icon: SecurityIcon, label: "24/7 Security" },
  { icon: UtensilsCrossed, label: "Meal Plans Available" },
];

export default function ListingDetailPage() {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          <Link
            href="/pgconnect"
            className="flex items-center gap-1 text-gray-600 hover:text-[#1E40AF] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </Link>
          <Link href="/pgconnect" className="text-xl font-bold text-gray-900">
            <span className="font-extrabold text-[#1E40AF]">PG</span>
            <span className="font-light">Connect</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Image Gallery */}
        <div className="relative rounded-lg overflow-hidden mb-6">
          <div className="h-64 sm:h-80 md:h-[420px] bg-gray-200">
            <img
              src={images[selectedImage]}
              alt="Property view"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Thumbnails overlay */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === i
                    ? "border-white shadow-lg scale-105"
                    : "border-white/50 opacity-80 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Sunnyside PG for Students &amp; Professionals - Single &amp; Shared Rooms
        </h1>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                About the Property
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Located near the university campus, Sunnyside PG offers fully
                furnished rooms with modern amenities, secure entry, and a
                vibrant community. Ideal for students and working professionals
                looking for a comfortable and convenient stay.
              </p>
            </section>

            {/* Amenities */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {amenitiesList.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                  >
                    <Icon className="h-5 w-5 text-[#1E40AF] shrink-0" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Location / Map */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="h-64 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                  <MapPin className="h-12 w-12 mb-2 text-[#1E40AF]" />
                  <p className="text-sm font-medium text-gray-600">
                    View on Google Maps
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    123 University Road, Cityville.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right column - Contact Provider */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-lg border border-gray-200 shadow-md p-6 space-y-5">
              <h3 className="text-lg font-bold text-gray-900">
                Contact Provider
              </h3>

              {/* Price */}
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  ₹12,000
                </span>
                <span className="text-sm text-gray-500"> / month</span>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Availability:</span>
                  <span className="font-semibold text-[#10B981]">
                    Available Now
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Occupancy:</span>
                  <span className="font-semibold text-gray-800">
                    Single &amp; Double
                  </span>
                </div>
              </div>

              {/* Request Callback */}
              <button className="w-full flex items-center justify-center gap-2 bg-[#1E40AF] text-white font-semibold py-3 rounded-lg hover:bg-[#1e3a8a] active:scale-[0.98] transition-all shadow-md hover:shadow-lg">
                <Phone className="h-4 w-4" />
                Request Callback
              </button>

              {/* Chat & Book */}
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors text-sm">
                  <MessageCircle className="h-4 w-4" />
                  Chat with Provider
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors text-sm">
                  <CalendarCheck className="h-4 w-4" />
                  Book a Visit
                </button>
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Trusted Provider:</span>
                <span className="flex items-center gap-1 text-[#10B981] font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified by PGConnect
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
