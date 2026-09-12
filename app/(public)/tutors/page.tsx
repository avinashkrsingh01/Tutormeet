import type { Metadata } from "next";
import { Suspense } from "react";
import { TutorSearchPage } from "@/components/tutors/TutorSearchPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title:       "Find Verified Home Tutors Near You",
  description: "Search verified home tutors by subject, class, board, city, fee and availability. Every tutor on TutorMeet is background-checked and interviewed.",
  canonical:   "/tutors",
  keywords:    [
    "find home tutor",
    "search tutors India",
    "verified private tutor",
    "home tutor by subject",
    "CBSE home tutor near me",
    "Class 10 tutor",
    "Maths tutor home",
  ],
});

export default function TutorsPage() {
  return (
    <Suspense>
      <TutorSearchPage />
    </Suspense>
  );
}
