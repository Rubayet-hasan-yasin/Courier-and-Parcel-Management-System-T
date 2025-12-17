'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          if (userData.role === 'admin') {
            router.push('/admin');
          } else if (userData.role === 'delivery_agent') {
            router.push('/agent');
          } else {
            router.push('/customer');
          }
        } catch (error) {
        }
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">📦 Courier System</span>
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Courier & Parcel Management
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Track, manage, and deliver parcels efficiently with our comprehensive courier management system
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/track"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg transition shadow-sm"
            >
              Track Parcel
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 font-semibold text-lg transition"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Booking</h3>
            <p className="text-gray-600">Book parcels quickly with our simple and intuitive interface</p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Tracking</h3>
            <p className="text-gray-600">Track your parcels with live GPS updates and notifications</p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Reliable delivery with professional and trained agents</p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition">
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">COD Available</h3>
            <p className="text-gray-600">Cash on delivery option for your convenience and flexibility</p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Verification</h3>
            <p className="text-gray-600">Secure pickup and delivery confirmation with QR scanning</p>
          </div>

          <div className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Notifications</h3>
            <p className="text-gray-600">Stay updated with instant email alerts for every status change</p>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">
            © 2025 Courier Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
