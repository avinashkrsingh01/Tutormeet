import Link from "next/link";
import type { Metadata } from "next";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { MessageCircle, Phone, Mail, ArrowRight, HelpCircle, ShieldCheck, BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Support" };

const channels = [
  {
    icon:     <MessageCircle className="h-6 w-6" />,
    title:    "WhatsApp",
    desc:     "Chat with our support team.",
    action:   "Open WhatsApp",
    href:     "https://wa.me/919999999999",
    color:    "bg-emerald-50 text-emerald-700",
  },
  {
    icon:     <Phone className="h-6 w-6" />,
    title:    "Call us",
    desc:     "Speak to a support executive.",
    action:   "Call now",
    href:     "tel:+919999999999",
    color:    "bg-blue-50 text-blue-700",
  },
  {
    icon:     <Mail className="h-6 w-6" />,
    title:    "Email",
    desc:     "We reply within one business day.",
    action:   "Send email",
    href:     "mailto:tutors@tutormeet.in",
    color:    "bg-brand-50 text-brand-700",
  },
];

const faqs = [
  { q: "How long does verification take?",           href: "/for-tutors#verification" },
  { q: "What documents do I need to upload?",        href: "/tutor/documents" },
  { q: "How do I update my teaching preferences?",   href: "/tutor/profile" },
  { q: "When will I receive student requests?",      href: "/tutor/status" },
  { q: "How do I mark attendance for a session?",    href: "/tutor/attendance" },
];

export default function TutorSupportPage() {
  return (
    <div>
      <DashboardHeader title="Support" description="We're here to help." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {channels.map((c) => (
          <Card key={c.title} padding="md">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${c.color}`}>
              {c.icon}
            </div>
            <h3 className="mb-1 text-sm font-bold text-navy-900">{c.title}</h3>
            <p className="mb-4 text-xs text-neutral-500">{c.desc}</p>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              {c.action} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-bold text-navy-900">Common questions</h2>
        </div>
        <ul className="divide-y divide-neutral-50">
          {faqs.map((faq) => (
            <li key={faq.q}>
              <Link href={faq.href} className="flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors">
                <HelpCircle className="h-4 w-4 flex-shrink-0 text-brand-600" />
                <span className="flex-1 text-sm text-neutral-700">{faq.q}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-neutral-400" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4">
        <p className="text-xs font-semibold text-navy-900">Support hours</p>
        <p className="mt-0.5 text-xs text-neutral-500">Monday–Saturday, 9 AM–7 PM IST.</p>
      </div>
    </div>
  );
}
