'use client';

import { useEffect, useState } from 'react';
import { vendor, uploadToCloudinary } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { VendorProfile } from '@/lib/api';
import Badge from '@/components/ui/Badge';

type SettingsTab = 'profile' | 'kyc' | 'notifications' | 'security';

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(!profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<SettingsTab>('profile');

  // Profile form
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    phoneNumber: '',
    description: '',
    addressLine1: '',
    addressLine2: '',
    village: '',
    district: '',
    state: '',
    pincode: '',
  });

  // Bank details form
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });

  // KYC document URLs
  const [kycDocs, setKycDocs] = useState({
    aadhaarUrl: '',
    panUrl: '',
    fssaiUrl: '',
    bankPassbookUrl: '',
  });

  // Track which KYC doc is currently uploading
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    orderEmail: true, orderPush: true,
    reviewEmail: true, reviewPush: false,
    paymentEmail: true, paymentPush: true,
    stockEmail: true, stockPush: true,
    promotionEmail: false, promotionPush: false,
  });

  // Security
  const [passwordForm, setPasswordForm] = useState({
    current: '', newPass: '', confirm: '',
  });

  useEffect(() => {
    function populateFromProfile(p: VendorProfile) {
      setProfileForm({
        businessName: p.businessName || '',
        phoneNumber: p.phoneNumber || '',
        description: p.description || '',
        addressLine1: p.address?.addressLine1 || '',
        addressLine2: p.address?.addressLine2 || '',
        village: p.address?.village || '',
        district: p.address?.district || '',
        state: p.address?.state || 'Telangana',
        pincode: p.address?.pincode || '',
      });
      setBankForm({
        accountHolderName: p.bankDetails?.accountHolderName || '',
        accountNumber: p.bankDetails?.accountNumber || '',
        ifscCode: p.bankDetails?.ifscCode || '',
        bankName: p.bankDetails?.bankName || '',
      });
      setKycDocs({
        aadhaarUrl: p.kycDocuments?.aadhaarUrl || '',
        panUrl: p.kycDocuments?.panUrl || '',
        fssaiUrl: p.kycDocuments?.fssaiUrl || '',
        bankPassbookUrl: p.kycDocuments?.bankPassbookUrl || '',
      });
    }

    if (profile) {
      populateFromProfile(profile);
      setLoading(false);
    } else {
      vendor.getProfile()
        .then((p) => populateFromProfile(p))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [profile]);

  function clearMessages() { setError(''); setSuccess(''); }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setSaving(true);
    try {
      await vendor.updateProfile({
        businessName: profileForm.businessName,
        description: profileForm.description,
        phoneNumber: profileForm.phoneNumber,
        address: {
          addressLine1: profileForm.addressLine1,
          addressLine2: profileForm.addressLine2 || undefined,
          village: profileForm.village || undefined,
          district: profileForm.district,
          state: profileForm.state,
          pincode: profileForm.pincode,
        },
      });
      await refreshProfile();
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError((err as { message?: string })?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleKycDocUpload(field: keyof typeof kycDocs, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(field);
    try {
      const result = await uploadToCloudinary(file, 'kyc_document');
      setKycDocs((prev) => ({ ...prev, [field]: result.url }));
    } catch {
      setError('Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  }

  async function handleKycSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setSaving(true);
    try {
      await vendor.updateProfile({ bankDetails: bankForm });
      await vendor.submitKyc(kycDocs);
      await refreshProfile();
      setSuccess('KYC documents submitted for verification');
    } catch (err) {
      setError((err as { message?: string })?.message || 'Failed to submit KYC');
    } finally {
      setSaving(false);
    }
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    if (passwordForm.newPass !== passwordForm.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSuccess('Password change is handled via authentication provider');
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  }

  const KYC_STATUS_MAP: Record<string, { label: string; variant: 'gray' | 'warning' | 'success' | 'danger' }> = {
    not_submitted: { label: 'Not Submitted', variant: 'gray' },
    submitted: { label: 'Under Review', variant: 'warning' },
    verified: { label: 'Verified', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const kycStatus = KYC_STATUS_MAP[profile?.kycStatus || 'not_submitted'];

  const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'profile',
      label: 'Store Info',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      ),
    },
    {
      key: 'kyc',
      label: 'KYC & Bank',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
    {
      key: 'security',
      label: 'Security',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your business profile, compliance, and preferences</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); clearMessages(); }}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === 'kyc' && (
              <Badge variant={kycStatus.variant} className="ml-1">{kycStatus.label}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* ──── PROFILE TAB ──── */}
      {tab === 'profile' && (
        <form onSubmit={handleProfileSave} className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Business Information</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Business Name</label>
                <input type="text" value={profileForm.businessName} onChange={(e) => setProfileForm((f) => ({ ...f, businessName: e.target.value }))} className="input-field rounded-xl" required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" value={profileForm.phoneNumber} onChange={(e) => setProfileForm((f) => ({ ...f, phoneNumber: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={profileForm.description} onChange={(e) => setProfileForm((f) => ({ ...f, description: e.target.value }))} className="input-field min-h-[80px] resize-y" placeholder="Tell customers about your farm or business..." />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Address</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Address Line 1</label>
                <input type="text" value={profileForm.addressLine1} onChange={(e) => setProfileForm((f) => ({ ...f, addressLine1: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">Address Line 2</label>
                <input type="text" value={profileForm.addressLine2} onChange={(e) => setProfileForm((f) => ({ ...f, addressLine2: e.target.value }))} className="input-field" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Village</label>
                  <input type="text" value={profileForm.village} onChange={(e) => setProfileForm((f) => ({ ...f, village: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">District</label>
                  <input type="text" value={profileForm.district} onChange={(e) => setProfileForm((f) => ({ ...f, district: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">State</label>
                  <input type="text" value={profileForm.state} onChange={(e) => setProfileForm((f) => ({ ...f, state: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input type="text" value={profileForm.pincode} onChange={(e) => setProfileForm((f) => ({ ...f, pincode: e.target.value }))} className="input-field" pattern="[0-9]{6}" maxLength={6} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ──── KYC TAB ──── */}
      {tab === 'kyc' && (
        <form onSubmit={handleKycSubmit} className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Bank Details</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Account Holder Name</label>
                  <input type="text" value={bankForm.accountHolderName} onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="label">Bank Name</label>
                  <input type="text" value={bankForm.bankName} onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))} className="input-field" required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Account Number</label>
                  <input type="text" value={bankForm.accountNumber} onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="label">IFSC Code</label>
                  <input type="text" value={bankForm.ifscCode} onChange={(e) => setBankForm((f) => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} className="input-field uppercase" placeholder="SBIN0001234" maxLength={11} required />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">KYC Documents</h2>
            <p className="mb-4 text-sm text-gray-500">
              Upload scanned copies of your identity and business documents.
            </p>
            <div className="space-y-4">
              {[
                { key: 'aadhaarUrl' as const, label: 'Aadhaar Card' },
                { key: 'panUrl' as const, label: 'PAN Card' },
                { key: 'fssaiUrl' as const, label: 'FSSAI License' },
                { key: 'bankPassbookUrl' as const, label: 'Bank Passbook / Cancelled Cheque' },
              ].map((doc) => (
                <div key={doc.key} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                    {uploadingDoc === doc.key && (
                      <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                        Uploading…
                      </span>
                    )}
                    {!uploadingDoc && kycDocs[doc.key] && (
                      <span className="text-xs font-medium text-green-600">Uploaded ✓</span>
                    )}
                  </div>
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-brand-500 hover:text-brand-700 ${uploadingDoc === doc.key ? 'pointer-events-none opacity-50' : ''}`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {kycDocs[doc.key] ? 'Replace' : 'Upload'}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleKycDocUpload(doc.key, e)} disabled={uploadingDoc === doc.key} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving || profile?.kycStatus === 'verified'} className="btn-primary">
              {saving ? 'Submitting...' : profile?.kycStatus === 'verified' ? 'KYC Verified ✓' : 'Submit KYC'}
            </button>
          </div>
        </form>
      )}

      {/* ──── NOTIFICATIONS TAB ──── */}
      {tab === 'notifications' && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
            <h2 className="mb-2 font-display text-lg font-semibold text-gray-900">Notification Preferences</h2>
            <p className="mb-6 text-sm text-gray-500">Choose how you want to receive notifications</p>
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_60px_60px] items-center gap-4 border-b border-gray-100 pb-2 text-xs font-medium text-gray-500 uppercase">
                <span>Type</span><span className="text-center">Email</span><span className="text-center">Push</span>
              </div>
              {[
                { label: 'New Orders', desc: 'When a new order is placed', emailKey: 'orderEmail' as const, pushKey: 'orderPush' as const },
                { label: 'Reviews', desc: 'When a customer leaves a review', emailKey: 'reviewEmail' as const, pushKey: 'reviewPush' as const },
                { label: 'Payments', desc: 'Payment settlements and payouts', emailKey: 'paymentEmail' as const, pushKey: 'paymentPush' as const },
                { label: 'Low Stock Alerts', desc: 'When stock falls below threshold', emailKey: 'stockEmail' as const, pushKey: 'stockPush' as const },
                { label: 'Promotions', desc: 'Platform promotions and announcements', emailKey: 'promotionEmail' as const, pushKey: 'promotionPush' as const },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[1fr_60px_60px] items-center gap-4 rounded-lg py-3 transition-colors hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-500">{row.desc}</p>
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs[row.emailKey]}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, [row.emailKey]: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs[row.pushKey]}
                      onChange={(e) => setNotifPrefs((p) => ({ ...p, [row.pushKey]: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setSuccess('Notification preferences saved')} className="btn-primary bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800">
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* ──── SECURITY TAB ──── */}
      {tab === 'security' && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))} className="input-field" required autoComplete="current-password" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">New Password</label>
                  <input type="password" value={passwordForm.newPass} onChange={(e) => setPasswordForm((f) => ({ ...f, newPass: e.target.value }))} className="input-field" required minLength={8} autoComplete="new-password" />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))} className="input-field" required minLength={8} autoComplete="new-password" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">Update Password</button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100/60 shadow-sm p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-gray-900">Active Sessions</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Session</p>
                    <p className="text-xs text-gray-500">This browser · Last active now</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-red-100/60 shadow-sm p-6">
            <h2 className="mb-2 font-display text-lg font-semibold text-red-700">Danger Zone</h2>
            <p className="mb-4 text-sm text-gray-500">
              Permanently delete your vendor account and all associated data.
            </p>
            <button className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100">
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
