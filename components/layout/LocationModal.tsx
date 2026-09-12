"use client";

import { useState, useEffect } from "react";
import { useLocation } from "./LocationProvider";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LocationModal() {
  const { location, setLocation, isModalOpen, closeModal } = useLocation();
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");

  // Populate form if location already exists when modal opens
  useEffect(() => {
    if (isModalOpen && location) {
      setCity(location.city);
      setPincode(location.pincode);
    }
  }, [isModalOpen, location]);

  if (!isModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !pincode.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    
    // Optional basic pincode validation (assumes 6 digits for India)
    if (!/^\d{6}$/.test(pincode.trim())) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    setLocation({ city: city.trim(), pincode: pincode.trim() });
    setError("");
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl card-glass">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900">
            <MapPin className="h-5 w-5 text-accent-500" />
            Choose your location
          </h2>
          <button
            onClick={closeModal}
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-200 hover:text-navy-900 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="mb-6 text-sm text-neutral-600">
            Select a location to see tutors available for home tuition in your area.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="city" className="label-base">City</label>
              <input
                id="city"
                type="text"
                placeholder="e.g. Patna"
                className="input-base"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="pincode" className="label-base">Pincode</label>
              <input
                id="pincode"
                type="text"
                placeholder="e.g. 801503"
                className="input-base"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600 animate-fade-in">{error}</p>
            )}

            <Button type="submit" variant="primary" className="mt-4 w-full">
              Apply Location
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
