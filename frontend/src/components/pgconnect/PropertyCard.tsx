import { ShieldCheck, Wifi, Wind, Utensils, MapPin } from "lucide-react";
import Link from "next/link";

export interface PropertyCardProps {
  id: string;
  image: string;
  price: number;
  title: string;
  landmark: string;
  verified: boolean;
  amenities: { wifi?: boolean; ac?: boolean; food?: boolean };
}

export default function PropertyCard({
  id,
  image,
  price,
  title,
  landmark,
  verified,
  amenities,
}: PropertyCardProps) {
  return (
    <Link href={`/pgconnect/listing/${id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
        {/* Image */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {verified && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#10B981] text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xl font-bold text-gray-900">
              ₹{price.toLocaleString("en-IN")}
            </span>
            <span className="text-sm text-gray-500">/ month</span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1 group-hover:text-[#1E40AF] transition-colors">
            {title}
          </h3>

          {/* Landmark */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{landmark}</span>
          </div>

          {/* Amenities */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            {amenities.wifi && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Wifi className="h-4 w-4 text-[#1E40AF]" />
                <span>WiFi</span>
              </div>
            )}
            {amenities.ac && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Wind className="h-4 w-4 text-[#1E40AF]" />
                <span>AC</span>
              </div>
            )}
            {amenities.food && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Utensils className="h-4 w-4 text-[#1E40AF]" />
                <span>Food</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
