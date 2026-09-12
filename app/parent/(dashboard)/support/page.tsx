import Link from "next/link";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import {
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  BookOpen,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support" };

const supportOptions = [
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Chat with us",
    desc: "Get help from our team via WhatsApp.",
    action: "Open WhatsApp",
    href: "https://wa.me/919999999999",
    external: true,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: "Call us",
    desc: "Speak to a support executive directly.",
    action: "Call now",
    href: "tel:+919999999999",
    external: true,
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Email us",
    desc: "We reply within one business day.",
    action: "Send email",
    href: "mailto:support@tutormeet.in",
    external: true,
    color: "bg-brand-50 text-brand-700",
  },
];

const helpTopics = [
  {
    icon: <BookOpen className="h-4 w-4" />,
    question: "How do I post a tuition requirement?",
    href: "/parent/requirements/new",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    question: "How are tutors verified?",
    href: "/for-parents#verification",
  },
  {
    icon: <HelpCircle className="h-4 w-4" />,
    question: "How do I cancel or change my requirement?",
    href: "/parent/requirements",
  },
  {
    icon: <HelpCircle className="h-4 w-4" />,
    question: "What happens after I post a requirement?",
    href: "/for-parents#how-it-works",
  },
];

export default function SupportPage() {
  return (
    <div>
      <DashboardHeader
        title="Support"
        description="We're here to help. Reach out any time."
      />

      {/* Contact channels */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {supportOptions.map((opt) => (
          <Card key={opt.title} padding="md">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${opt.color}`}>
              {opt.icon}
            </div>
            <h3 className="mb-1 text-sm font-bold text-navy-900">{opt.title}</h3>
            <p className="mb-4 text-xs leading-relaxed text-neutral-500">{opt.desc}</p>
            <a
              href={opt.href}
              target={opt.external ? "_blank" : undefined}
              rel={opt.external ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors"
            >
              {opt.action}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Card>
        ))}
      </div>

      {/* Common help topics */}
      <Card padding="none">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-bold text-navy-900">Common Questions</h2>
        </div>
        <ul className="divide-y divide-neutral-50">
          {helpTopics.map((topic) => (
            <li key={topic.question}>
              <Link
                href={topic.href}
                className="flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors"
              >
                <span className="flex-shrink-0 text-brand-700">{topic.icon}</span>
                <span className="flex-1 text-sm text-neutral-700">{topic.question}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-neutral-400" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* Operating hours */}
      <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4">
        <p className="text-xs font-semibold text-navy-900">Support hours</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          Monday – Saturday, 9:00 AM – 7:00 PM IST.
          Outside hours? Send an email and we&apos;ll respond the next morning.
        </p>
      </div>
    </div>
  );
}
