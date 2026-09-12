"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserLocation {
  city: string;
  pincode: string;
}

interface LocationContextType {
  location: UserLocation | null;
  setLocation: (loc: UserLocation) => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing location on mount
    const storedLocation = localStorage.getItem("tutormeet_location");
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        if (parsed.city && parsed.pincode) {
          setLocationState(parsed);
        }
      } catch (e) {
        console.error("Failed to parse location from local storage", e);
      }
    } else {
      // If no location is set, open the modal immediately to prompt the user
      setIsModalOpen(true);
    }
    setIsLoading(false);
  }, []);

  const setLocation = (loc: UserLocation) => {
    setLocationState(loc);
    localStorage.setItem("tutormeet_location", JSON.stringify(loc));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    // Optionally, we could prevent closing if location is null,
    // but forcing them might be bad UX if they just want to browse.
    // For now, allow them to close it.
    setIsModalOpen(false);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        isModalOpen,
        openModal,
        closeModal,
        isLoading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
