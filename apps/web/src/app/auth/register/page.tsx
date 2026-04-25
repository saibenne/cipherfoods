'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register({ name, email, password, phone: phone || undefined });
      router.push('/');
    } catch (err) {
      const msg = (err as { message?: string })?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 flex">
      {/* Right side - SVG Animation */}
      <div className="hidden lg:flex flex-1 relative bg-earth-100 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <svg className="w-full h-full text-earth-200" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 L0,50 Q25,25 50,50 T100,50 L100,100 Z" fill="currentColor" className="animate-pulse-slow" />
          </svg>
        </div>
        <div className="relative z-10 max-w-lg w-full p-8 animate-float-delayed">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="#fefae0" />
            <circle cx="200" cy="200" r="150" fill="#faedcd" className="animate-pulse-slow" />
            {/* Basket */}
            <path d="M120 200 L280 200 L250 300 L150 300 Z" fill="#d4a373" />
            <path d="M100 200 Q200 150 300 200" stroke="#d4a373" strokeWidth="16" fill="none" />
            {/* Produce in basket */}
            <circle cx="170" cy="180" r="40" fill="#ef4444" /> {/* Tomato */}
            <path d="M170 140 Q160 120 180 130" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />
            <circle cx="230" cy="190" r="35" fill="#f97316" /> {/* Orange */}
            <path d="M230 155 Q240 130 220 140" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />
            <circle cx="200" cy="160" r="30" fill="#eab308" /> {/* Lemon */}
            {/* Sparkles */}
            <circle cx="100" cy="120" r="6" fill="#16a34a" className="animate-ping" />
            <circle cx="320" cy="160" r="8" fill="#16a34a" className="animate-pulse" />
            <circle cx="280" cy="80" r="5" fill="#16a34a" className="animate-ping" style={{ animationDelay: '0.5s' }} />
          </svg>
          <div className="text-center mt-8">
            <h2 className="text-3xl font-display font-bold text-gray-900">Join the Community</h2>
            <p className="mt-4 text-lg text-gray-600">Discover authentic traditional foods.</p>
          </div>
        </div>
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 bg-white/60 p-8 rounded-3xl shadow-xl border border-white backdrop-blur-xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
            <svg className="h-7 w-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <p className="mt-3 font-display text-2xl font-bold gradient-text">CipherFoods</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Join CipherFoods for farm-fresh traditional foods</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              maxLength={10}
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="9876543210"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 pr-10 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {password && (
              <div className="mt-1.5 flex gap-1">
                {[
                  password.length >= 8,
                  /[A-Z]/.test(password),
                  /[0-9]/.test(password),
                ].map((met, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${met ? 'bg-brand-500' : 'bg-gray-200'}`} />
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 px-5 py-3.5 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-brand-700 hover:to-brand-800 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-center text-xs text-gray-400">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-brand-600 font-medium hover:text-brand-700">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-brand-600 font-medium hover:text-brand-700">Privacy Policy</Link>
          </p>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Already have an account?</span>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="mt-4 block w-full rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-brand-600 transition-all hover:bg-brand-50 hover:border-brand-200"
          >
            Log in
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
