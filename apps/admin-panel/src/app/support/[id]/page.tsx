'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { support, type Ticket, type TicketMessage } from '@/lib/api';

const statusColors: Record<string, string> = {
  open: 'badge-warning',
  in_progress: 'badge-info',
  resolved: 'badge-success',
  closed: 'badge-gray',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    support.getTicket(params.id as string)
      .then(setTicket)
      .catch(() => router.replace('/support'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !reply.trim()) return;
    setSending(true);
    try {
      await support.reply(ticket.id, reply.trim());
      setReply('');
      // Refresh ticket
      const updated = await support.getTicket(ticket.id);
      setTicket(updated);
    } catch {
      // handled silently
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!ticket) return;
    setResolving(true);
    try {
      await support.resolve(ticket.id);
      setTicket({ ...ticket, status: 'resolved' });
    } catch {
      // handled silently
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-secondary">← Back</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {ticket.userName} · {ticket.userEmail}
          </p>
        </div>
        <span className={statusColors[ticket.status] || 'badge-gray'}>
          {ticket.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversation */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Conversation</h2>
            <div className="space-y-4">
              {ticket.messages.map((msg: TicketMessage) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-4 ${
                    msg.senderRole === 'admin'
                      ? 'ml-8 border border-brand-100 bg-brand-50'
                      : 'mr-8 bg-gray-100'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{msg.senderName}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{msg.message}</p>
                </div>
              ))}
              {ticket.messages.length === 0 && (
                <p className="text-center text-sm text-gray-400">No messages yet</p>
              )}
            </div>
          </div>

          {/* Reply form */}
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <form onSubmit={handleReply} className="card">
              <h3 className="mb-3 text-sm font-semibold">Reply</h3>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="input mb-3 min-h-[100px] resize-y"
                placeholder="Type your reply..."
                required
              />
              <div className="flex justify-end">
                <button type="submit" disabled={sending} className="btn-primary">
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span className={statusColors[ticket.status] || 'badge-gray'}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Priority</dt>
                <dd className="font-medium capitalize text-gray-900">{ticket.priority}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-700">{new Date(ticket.createdAt).toLocaleDateString('en-IN')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-700">{new Date(ticket.updatedAt).toLocaleDateString('en-IN')}</dd>
              </div>
            </dl>
          </div>

          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Actions</h3>
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="btn-success w-full"
              >
                {resolving ? 'Resolving...' : 'Mark as Resolved'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
