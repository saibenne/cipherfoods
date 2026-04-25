'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  senderName: string;
  text: string;
  createdAt: string;
}

const MOCK_TICKET = {
  id: 'TKT-001',
  subject: 'Delivery delayed for order #1042',
  status: 'in_progress' as 'open' | 'in_progress' | 'resolved' | 'closed',
  createdAt: '2026-04-05T10:00:00Z',
  messages: [
    { id: '1', sender: 'user' as const, senderName: 'You', text: 'Hi, my order #1042 was supposed to be delivered yesterday but I still haven\'t received it. Can you check the status?', createdAt: '2026-04-05T10:00:00Z' },
    { id: '2', sender: 'agent' as const, senderName: 'Support Team', text: 'Hello! We apologize for the delay. Let me check the status of your order right away.', createdAt: '2026-04-05T10:15:00Z' },
    { id: '3', sender: 'agent' as const, senderName: 'Support Team', text: 'I\'ve checked with our delivery partner. Your order is currently at the local hub and will be out for delivery today. We\'re sorry for the inconvenience.', createdAt: '2026-04-05T10:20:00Z' },
  ] as Message[],
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'info' | 'gray'> = {
  open: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'gray',
};

export default function SupportTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_TICKET.messages);
  const [sending, setSending] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    // Mock sending
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: user?.name || 'You',
      text: replyText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setReplyText('');
    setSending(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gray-500">Please login to view ticket details.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Support', href: '/support' }, { label: id }]} />

      {/* Ticket Info */}
      <div className="rounded-3xl bg-white border border-gray-100/60 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-gray-900">{MOCK_TICKET.subject}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Ticket {MOCK_TICKET.id} • Opened on{' '}
              {new Date(MOCK_TICKET.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Badge variant={STATUS_BADGE[MOCK_TICKET.status]}>
            {MOCK_TICKET.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Message Thread */}
      <div className="mt-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-2xl border p-4 transition-all ${
              msg.sender === 'user'
                ? 'ml-8 border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100/50'
                : 'mr-8 border-gray-100/60 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-brand-200 text-brand-700'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {msg.senderName.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-gray-900">{msg.senderName}</span>
              </div>
              <time className="text-xs text-gray-400">
                {new Date(msg.createdAt).toLocaleString('en-IN', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </time>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Reply */}
      {MOCK_TICKET.status !== 'closed' && (
        <form onSubmit={handleReply} className="mt-6">
          <label htmlFor="reply" className="mb-1 block text-sm font-medium text-gray-700">Reply</label>
          <textarea
            id="reply"
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            className="rounded-2xl border-gray-200 input-field"
            required
          />
          <button type="submit" disabled={sending || !replyText.trim()} className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-2.5 text-white font-semibold shadow-md transition-all hover:shadow-lg mt-3">
            {sending ? 'Sending...' : 'Send Reply'}
          </button>
        </form>
      )}
    </div>
  );
}
