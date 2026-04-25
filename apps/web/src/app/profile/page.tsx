'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Breadcrumb from '@/components/ui/Breadcrumb';

type Tab = 'personal' | 'addresses' | 'security';

interface SavedAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

const MOCK_ADDRESSES: SavedAddress[] = [
  {
    id: '1',
    label: 'Home',
    addressLine1: '123 MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    phone: '+91 98765 43210',
    isDefault: true,
  },
  {
    id: '2',
    label: 'Office',
    addressLine1: '456 Whitefield Main Road, ITPL',
    addressLine2: 'Block A, 3rd Floor',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    phone: '+91 98765 43210',
    isDefault: false,
  },
];

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Personal info
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Addresses
  const [addresses, setAddresses] = useState<SavedAddress[]>(MOCK_ADDRESSES);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState('');

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/profile');
    return null;
  }

  const initials = (user?.name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Mock save
    await new Promise((r) => setTimeout(r, 500));
    setSuccessMsg('Profile updated successfully');
    setSaving(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    if (newPassword.length < 8) {
      setSecurityError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('Passwords do not match');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSuccessMsg('Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSaving(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'personal', label: 'Personal Info', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { key: 'addresses', label: 'Addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { key: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: 'Profile' }]} />

      {/* Profile Header */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 ring-4 ring-brand-100/50 text-2xl font-bold text-brand-700">
          {initials}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">{user?.name}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="mt-4 rounded-2xl bg-green-50 border border-green-100 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <nav className="w-full shrink-0 md:w-48">
          <ul className="rounded-2xl bg-gray-50 p-1 space-y-1">
            {TABS.map((tab) => (
              <li key={tab.key}>
                <button
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white shadow-sm text-brand-700'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </li>
          </ul>
        </nav>

        {/* Tab Content */}
        <div className="flex-1">
          {/* Personal Info */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSavePersonal} className="rounded-3xl border border-gray-100/60 bg-white shadow-sm p-6">
              <h2 className="font-display text-lg font-bold text-gray-900">Personal Information</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email-display" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    id="email-display"
                    type="email"
                    value={email}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-100/50 px-5 py-3.5 focus:outline-none transition-all"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                </div>
                <div>
                  <label htmlFor="phone-input" className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    id="phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="mt-6 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-brand-700 hover:to-brand-800 transition-all duration-300 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Addresses */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-gray-900">Saved Addresses</h2>
              </div>
              <div className="mt-4 space-y-3">
                {addresses.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
                    <p className="text-gray-400">No saved addresses</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className={`rounded-2xl border p-5 transition-all ${
                      addr.isDefault ? 'border-brand-300 bg-brand-50/50' : 'border-gray-100/60 bg-white hover:border-brand-200 hover:shadow-md'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">Default</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addr.city}, {addr.state} – {addr.pincode}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">{addr.phone}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="text-sm text-brand-600 hover:text-brand-700"
                          >
                            Set as default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="rounded-3xl border border-gray-100/60 bg-white shadow-sm p-6">
              <h2 className="font-display text-lg font-bold text-gray-900">Change Password</h2>
              {securityError && (
                <div className="mt-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">{securityError}</div>
              )}
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="current-pw" className="mb-1 block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    id="current-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label htmlFor="new-pw" className="mb-1 block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    id="new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
                </div>
                <div>
                  <label htmlFor="confirm-pw" className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    id="confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="mt-6 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-brand-700 hover:to-brand-800 transition-all duration-300 disabled:opacity-50">
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
