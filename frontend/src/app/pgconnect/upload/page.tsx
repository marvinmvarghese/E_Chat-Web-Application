"use client";

import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  X,
  Wifi,
  Wind,
  Zap,
  UtensilsCrossed,
  WashingMachine,
  ShieldCheck,
  Car,
  Tv,
  Dumbbell,
} from "lucide-react";

const STEPS = ["Details", "Amenities", "Photos", "Pricing"] as const;

const amenityOptions = [
  { id: "wifi", icon: Wifi, label: "WiFi" },
  { id: "ac", icon: Wind, label: "Air Conditioning" },
  { id: "power", icon: Zap, label: "Power Backup" },
  { id: "food", icon: UtensilsCrossed, label: "Meals" },
  { id: "laundry", icon: WashingMachine, label: "Laundry" },
  { id: "security", icon: ShieldCheck, label: "24/7 Security" },
  { id: "parking", icon: Car, label: "Parking" },
  { id: "tv", icon: Tv, label: "TV / Common Area" },
  { id: "gym", icon: Dumbbell, label: "Gym" },
];

type GenderPreference = "Boys" | "Girls" | "Unisex";

export default function PropertyUploadPage() {
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1 - Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState<GenderPreference>("Unisex");
  const [address, setAddress] = useState("");

  // Step 2 - Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set()
  );

  // Step 3 - Photos
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);

  // Step 4 - Pricing
  const [singlePrice, setSinglePrice] = useState("");
  const [doublePrice, setDoublePrice] = useState("");
  const [triplePrice, setTriplePrice] = useState("");
  const [deposit, setDeposit] = useState("");

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 10,
  });

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const nextStep = () =>
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link
            href="/pgconnect"
            className="flex items-center gap-1 text-gray-600 hover:text-[#1E40AF] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            List Your Property
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < currentStep
                      ? "bg-[#10B981] text-white"
                      : i === currentStep
                      ? "bg-[#1E40AF] text-white shadow-md"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    i <= currentStep ? "text-[#1E40AF]" : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 -mt-5 mx-1 rounded ${
                    i < currentStep ? "bg-[#10B981]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
          {/* Step 1: Details */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">
                Property Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Property Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sunnyside PG for Students"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your property, its surroundings, and what makes it unique..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full property address"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender Preference
                </label>
                <div className="flex gap-3">
                  {(["Boys", "Girls", "Unisex"] as GenderPreference[]).map(
                    (option) => (
                      <button
                        key={option}
                        onClick={() => setGender(option)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                          gender === option
                            ? "bg-[#1E40AF] text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {option}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Amenities */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">
                Select Amenities
              </h2>
              <p className="text-sm text-gray-500">
                Choose the amenities available at your property.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenityOptions.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => toggleAmenity(id)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedAmenities.has(id)
                        ? "border-[#1E40AF] bg-blue-50 text-[#1E40AF]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">
                Upload Photos
              </h2>
              <p className="text-sm text-gray-500">
                Add up to 10 photos of your property. High-quality images attract more tenants.
              </p>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-[#1E40AF] bg-blue-50"
                    : "border-gray-300 hover:border-[#1E40AF] hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive
                    ? "Drop images here..."
                    : "Drag & drop images here, or click to browse"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, JPEG, WEBP up to 10 files
                </p>
              </div>

              {/* Photo previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden aspect-square">
                      <img
                        src={photo.preview}
                        alt={`Upload ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">
                Set Pricing
              </h2>
              <p className="text-sm text-gray-500">
                Set monthly rent for different occupancy types.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Single Occupancy (₹/month)
                  </label>
                  <input
                    type="number"
                    value={singlePrice}
                    onChange={(e) => setSinglePrice(e.target.value)}
                    placeholder="e.g., 12000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Double Occupancy (₹/month)
                  </label>
                  <input
                    type="number"
                    value={doublePrice}
                    onChange={(e) => setDoublePrice(e.target.value)}
                    placeholder="e.g., 8000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Triple Occupancy (₹/month)
                  </label>
                  <input
                    type="number"
                    value={triplePrice}
                    onChange={(e) => setTriplePrice(e.target.value)}
                    placeholder="e.g., 6000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="e.g., 20000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/30 focus:border-[#1E40AF] transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentStep === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {currentStep < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 bg-[#1E40AF] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1e3a8a] active:scale-[0.98] transition-all shadow-md"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button className="flex items-center gap-2 bg-[#10B981] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md">
                <Check className="h-4 w-4" />
                Submit Property
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
