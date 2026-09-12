"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { ReportReviewModal } from "./ReportReviewModal";

interface TutorReportSectionProps {
  reviewId: string;
  children: React.ReactNode;
}

export function TutorReportSection({ reviewId, children }: TutorReportSectionProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="group relative">
      {children}

      {/* Report link — shown on hover */}
      <div className="mt-1.5 flex justify-end">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 text-2xs text-neutral-300 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 hover:text-red-500 transition-all"
          aria-label="Report this review"
        >
          <Flag className="h-3 w-3" />
          Report
        </button>
      </div>

      {showModal && (
        <ReportReviewModal
          reviewId={reviewId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
