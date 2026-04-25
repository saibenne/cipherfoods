'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { vendors, type Vendor } from '@/lib/api';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const statusColors: Record<string, string> = {
  pending: 'badge-warning',
  approved: 'badge-success',
  suspended: 'badge-danger',
  rejected: 'badge-danger',
};

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    vendors.getById(params.id as string)
      .then(setVendor)
      .catch(() => router.replace('/vendors'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleApprove = async () => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      await vendors.approve(vendor.id);
      setVendor({ ...vendor, status: 'approved' });
    } catch {
      // error handled silently
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!vendor) return;
    setActionLoading(true);
    try {
      await vendors.reject(vendor.id, rejectReason);
      setVendor({ ...vendor, status: 'rejected' });
      setShowRejectForm(false);
      setRejectReason('');
    } catch {
      // error handled silently
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn-secondary">← Back</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h1>
          <p className="mt-1 text-sm text-gray-500">{vendor.name} · {vendor.email}</p>
        </div>
        <span className={statusColors[vendor.status] || 'badge-gray'}>{vendor.status}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Vendor details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Business Information</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-gray-500">Business Name</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{vendor.businessName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Business Type</dt>
                <dd className="mt-1 text-sm font-medium capitalize text-gray-900">{vendor.businessType}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Owner Name</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{vendor.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{vendor.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{vendor.phone}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Address</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{vendor.address}</dd>
              </div>
            </dl>
          </div>

          {/* KYC Documents */}
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">KYC Documents</h2>
            {vendor.kycDocuments.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded</p>
            ) : (
              <div className="space-y-3">
                {vendor.kycDocuments.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div>
                      <p className="text-sm font-medium capitalize text-gray-900">{doc.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">Status: {doc.status}</p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-3 text-sm font-semibold uppercase text-gray-500">Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Products</span>
                <span className="font-medium text-gray-900">{vendor.totalProducts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-medium text-gray-900">{vendor.totalOrders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Revenue</span>
                <span className="font-medium text-gray-900">{formatCurrency(vendor.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rating</span>
                <span className="flex items-center gap-1 font-medium text-gray-900">
                  <span className="text-amber-500">★</span> {vendor.rating.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium text-gray-900">
                  {new Date(vendor.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {vendor.status === 'pending' && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold uppercase text-gray-500">Actions</h3>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="btn-success w-full"
              >
                {actionLoading ? 'Processing...' : 'Approve Vendor'}
              </button>
              {!showRejectForm ? (
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="btn-danger w-full"
                >
                  Reject Vendor
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    className="input min-h-[80px] resize-y"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="btn-danger flex-1"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
