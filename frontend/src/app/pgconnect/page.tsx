import PGHeader from "@/components/pgconnect/PGHeader";
import PropertyCard from "@/components/pgconnect/PropertyCard";
import { Home } from "lucide-react";

const properties = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop",
    price: 8000,
    title: "Greenview PG for Men - Double Sharing",
    landmark: "Near Koramangala Metro Station, Bangalore",
    verified: true,
    amenities: { wifi: true, ac: true, food: true },
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
    price: 12000,
    title: "Sunnyside PG for Students & Professionals",
    landmark: "Near University Campus, Cityville",
    verified: true,
    amenities: { wifi: true, ac: true, food: true },
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    price: 6500,
    title: "Comfort Stay PG - Girls Only",
    landmark: "Near Andheri Station, Mumbai",
    verified: false,
    amenities: { wifi: true, ac: false, food: true },
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop",
    price: 9500,
    title: "Urban Nest Co-living - Unisex",
    landmark: "Near Huda City Centre, Gurugram",
    verified: true,
    amenities: { wifi: true, ac: true, food: false },
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop",
    price: 7000,
    title: "Homely PG for Working Women",
    landmark: "Near Electronic City, Bangalore",
    verified: true,
    amenities: { wifi: true, ac: false, food: true },
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop",
    price: 15000,
    title: "Premium Stay PG - Single Room",
    landmark: "Near Connaught Place, Delhi",
    verified: true,
    amenities: { wifi: true, ac: true, food: true },
  },
];

export default function PGConnectSearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PGHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-[#1E40AF]" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              PG Accommodations
            </h1>
            <span className="text-sm text-gray-500">
              ({properties.length} results found)
            </span>
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </main>
    </div>
  );
}
