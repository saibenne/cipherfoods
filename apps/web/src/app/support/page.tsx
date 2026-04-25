'use client';

import { useState } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

const FAQ_SECTIONS = [
  {
    category: 'Orders & Delivery',
    items: [
      { q: 'How long does delivery take?', a: 'We offer same-day delivery in Hyderabad and 1-2 business days for other cities in Telangana. You\'ll receive a tracking link once your order is shipped.' },
      { q: 'What is the minimum order amount?', a: 'The minimum order amount is ₹99. Orders above ₹499 qualify for free delivery.' },
      { q: 'Can I track my order?', a: 'Yes! Once your order is confirmed, you can track it in real-time from your Orders page or using the tracking link sent to your email.' },
      { q: 'What if I receive a damaged product?', a: 'We have a hassle-free return policy. Contact our support team within 24 hours of delivery and we\'ll arrange a replacement or refund.' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, net banking, wallets, and cash on delivery (COD).' },
      { q: 'Is there a COD charge?', a: 'No, there is no additional charge for Cash on Delivery orders.' },
      { q: 'When will I get my refund?', a: 'Refunds are processed within 5-7 business days to your original payment method. COD refunds are credited to your CipherFoods wallet.' },
    ],
  },
  {
    category: 'Products & Quality',
    items: [
      { q: 'Are the products really organic?', a: 'Yes! All our products are sourced from certified organic farms in Telangana. We verify each farmer\'s practices before onboarding them.' },
      { q: 'How do you ensure freshness?', a: 'Products are picked fresh from farms and shipped within hours. Our cold chain logistics ensure everything reaches you in perfect condition.' },
      { q: 'Can I request products from specific farmers?', a: 'Yes! You can filter products by vendor/farmer on our products page and add your favorites to your wishlist.' },
    ],
  },
];

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  lastMessage: string;
}

const MOCK_TICKETS: SupportTicket[] = [
  { id: 'TKT-001', subject: 'Delivery delayed for order #1042', status: 'in_progress', createdAt: '2026-04-05T10:00:00Z', lastMessage: 'We are looking into this and will update you shortly.' },
  { id: 'TKT-002', subject: 'Wrong item received', status: 'resolved', createdAt: '2026-04-01T14:30:00Z', lastMessage: 'Replacement has been shipped. Expected delivery: Tomorrow.' },
];

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'info' | 'gray'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'gray',
};

export default function SupportPage() {
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const toggleFaq = (key: string) => {
    setOpenFaq(openFaq === key ? null : key);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setContactForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Support' }]} />

      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="mt-2 text-gray-500">Find answers or reach out to our team</p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* Left — FAQ */}
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-gray-900">Frequently Asked Questions</h2>

          <div className="mt-6 space-y-6">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-700">{section.category}</h3>
                <div className="mt-3 space-y-2">
                  {section.items.map((item, idx) => {
                    const key = `${section.category}-${idx}`;
                    const isOpen = openFaq === key;
                    return (
                      <div key={key} className="rounded-2xl border border-gray-100/60 bg-white shadow-sm">
                        <button
                          onClick={() => toggleFaq(key)}
                          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 rounded-2xl"
                          aria-expanded={isOpen}
                        >
                          {item.q}
                          <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        {isOpen && (
                          <div className="border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-600">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="mt-10">
            <h2 className="font-display text-xl font-bold text-gray-900">Contact Us</h2>
            <p className="mt-1 text-sm text-gray-500">Can&apos;t find an answer? Send us a message.</p>

            {submitted ? (
              <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
                <svg className="mx-auto h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                <p className="mt-3 font-semibold text-green-800">Message sent!</p>
                <p className="mt-1 text-sm text-green-600">We&apos;ll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="support-name" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <input id="support-name" type="text" required value={contactForm.name} onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))} className="rounded-2xl border-gray-200 input-field" placeholder="Your name" />
                  </div>
                  <div>
                    <label htmlFor="support-email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input id="support-email" type="email" required value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} className="rounded-2xl border-gray-200 input-field" placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="support-subject" className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                  <input id="support-subject" type="text" required value={contactForm.subject} onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))} className="rounded-2xl border-gray-200 input-field" placeholder="What can we help with?" />
                </div>
                <div>
                  <label htmlFor="support-message" className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                  <textarea id="support-message" required rows={4} value={contactForm.message} onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))} className="rounded-2xl border-gray-200 input-field" placeholder="Describe your issue in detail..." />
                </div>
                <button type="submit" className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 text-white font-semibold shadow-lg transition-all hover:shadow-xl">Send Message</button>
              </form>
            )}
          </div>
        </div>

        {/* Right — Tickets + Live Chat */}
        <div className="space-y-6">
          {/* Live Chat */}
          <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-cream-100">
              <svg className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
            </div>
            <h3 className="mt-3 font-display font-semibold text-gray-900">Live Chat</h3>
            <p className="mt-1 text-sm text-gray-500">Available Mon–Sat, 9 AM – 8 PM</p>
            <button className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-white font-semibold shadow-md transition-all hover:shadow-lg mt-4 w-full text-sm">Start Chat</button>
          </div>

          {/* Support Tickets */}
          {isAuthenticated && (
            <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-6">
              <h3 className="font-display font-semibold text-gray-900">Your Tickets</h3>
              {MOCK_TICKETS.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {MOCK_TICKETS.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/support/${ticket.id}`}
                      className="block rounded-2xl bg-white border border-gray-100/60 shadow-sm p-3 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                        <Badge variant={STATUS_BADGE[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{ticket.id} • {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">No support tickets yet.</p>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-6">
            <h3 className="font-display font-semibold text-gray-900">Other Ways to Reach Us</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                support@cipherfoods.com
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                +91 9876 543 210
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
