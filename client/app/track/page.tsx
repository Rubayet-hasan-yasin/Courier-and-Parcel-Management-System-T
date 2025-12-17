'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTrackParcel } from '@/lib/hooks';
import { useParcelTracking } from '@/lib/socket';

export default function TrackPage() {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [realtimeParcel, setRealtimeParcel] = useState<any>(null);

    const { data: initialParcel, isLoading, error, refetch } = useTrackParcel(searchQuery);

    // Use real-time hook
    useParcelTracking(initialParcel?.id || null, (data) => {
        if (data.type === 'status') {
            setRealtimeParcel(data.parcel);
            refetch();
        }
    });

    // Update local state when initial query loads
    useEffect(() => {
        if (initialParcel) {
            setRealtimeParcel(initialParcel);
        }
    }, [initialParcel]);

    const parcel = realtimeParcel || initialParcel; // periodic updates take precedence

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchQuery(trackingNumber.trim());
        setRealtimeParcel(null); // Reset real-time state on new search
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-gray-100 text-gray-700 border-gray-300';
            case 'picked_up':
                return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'in_transit':
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'delivered':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'failed':
                return 'bg-red-100 text-red-700 border-red-300';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return '⏳';
            case 'picked_up':
                return '📦';
            case 'in_transit':
                return '🚚';
            case 'delivered':
                return '✅';
            case 'failed':
                return '❌';
            default:
                return '📍';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            📦 Courier System
                        </Link>
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

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Parcel</h1>
                    <p className="text-lg text-gray-600">
                        Enter your tracking number to see the current status of your parcel
                    </p>
                </div>

                <form onSubmit={handleSearch} className="mb-8">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number (e.g., CPM-XXX-XXX)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !trackingNumber.trim()}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? 'Searching...' : 'Track'}
                        </button>
                    </div>
                </form>

                {error && searchQuery && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-700 font-semibold mb-2">Parcel Not Found</p>
                        <p className="text-red-600 text-sm">
                            No parcel found with tracking number "{searchQuery}". Please check and try again.
                        </p>
                    </div>
                )}

                {parcel && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className={`px-6 py-8 border-b-4 ${getStatusColor(parcel.status)}`}>
                            <div className="text-center">
                                <div className="text-6xl mb-4">{getStatusIcon(parcel.status)}</div>
                                <h2 className="text-2xl font-bold capitalize mb-2">
                                    {parcel.status.replace('_', ' ')}
                                </h2>
                                <p className="text-sm opacity-75">Tracking: {parcel.trackingNumber}</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Pickup Address</p>
                                        <p className="text-gray-900">{parcel.pickupAddress}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                                        <p className="text-gray-900">{parcel.deliveryAddress}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Parcel Details</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Type</p>
                                        <p className="text-gray-900 capitalize">{parcel.parcelType}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Size</p>
                                        <p className="text-gray-900 capitalize">{parcel.parcelSize}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Weight</p>
                                        <p className="text-gray-900">{parcel.weight ? `${parcel.weight} kg` : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Payment</p>
                                        <p className="text-gray-900 capitalize">{parcel.paymentMethod}</p>
                                    </div>
                                </div>
                                {parcel.description && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500 mb-1">Description</p>
                                        <p className="text-gray-900">{parcel.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
                                <div className="space-y-3">
                                    {parcel.deliveredAt && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Delivered</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(parcel.deliveredAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {parcel.pickedUpAt && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Picked Up</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(parcel.pickedUpAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Booked</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(parcel.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {parcel.agent && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Agent</h3>
                                    <p className="text-gray-900">{parcel.agent.name}</p>
                                    {parcel.agent.phone && (
                                        <p className="text-sm text-gray-500">{parcel.agent.phone}</p>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {!parcel && !error && searchQuery && (
                    <div className="text-center text-gray-500 mt-8">
                        <p>Enter a tracking number above to track your parcel</p>
                    </div>
                )}

                {!searchQuery && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
                        <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                        <p className="text-blue-700 text-sm">
                            Your tracking number was provided when you booked the parcel. It starts with "CPM-"
                            followed by alphanumeric characters. Check your email or booking confirmation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
